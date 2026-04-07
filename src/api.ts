import EventEmitter from 'events'
import PQueue from 'p-queue'
import { InstanceStatus } from '@companion-module/base'
import type { SpecteraInstance } from './main.js'
import type {
	AudioInput,
	AudioOutput,
	RfChannel,
	MobileDevice,
	SEKDevice,
	SKMDevice,
	Antenna,
	AudioLink,
	PsuState,
	TempState,
	FanState,
	BaseStationSite,
	BaseStationState,
	BaseStationIdentity,
	AudioLevels,
	AudioLevel,
	InterfaceStatusAudioNetwork,
	InterfaceStatusMadi,
	InterfaceStatusWordclock,
} from './types.js'
import { MtType, MicAudiolinkMode } from './types.js'
import { getAntennaFrequency } from './utils.js'
import type { SpecteraState } from './state.js'
import { Agent, Dispatcher } from 'undici'
import {
	UpdateVariableDefinitions,
	UpdateVariableValues,
	getAudioOutputSourceName,
	getAudioOutputActiveChannels,
	getAudioInputIemLinkDevices,
} from './variables.js'
import { UpdatePresets } from './presets.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdateActions } from './actions.js'
import {
	StateMap,
	VariableValue,
	RfChannelStateMap,
	AntennaStateMap,
	AudioInputStateMap,
	AudioOutputStateMap,
	MobileDeviceStateMap,
	PsuStateMap,
	TempStateMap,
	FanStateMap,
	BaseStationIdentityMap,
	BaseStationStateMap,
	BaseStationSiteMap,
	AudioNetworkStateMap,
	MadiStateMap,
	MadiInputStateMap,
	MadiOutputStateMap,
	WordclockInputStateMap,
	WordclockOutputStateMap,
} from './state_maps.js'

const REQUEST_INTERVAL_MS = 20

function isActiveAudioLinkId(id: number | undefined): boolean {
	return id !== undefined && id > -1
}

export class SpecteraApi extends EventEmitter {
	private readonly host: string
	private readonly password: string
	private readonly instance: SpecteraInstance
	private readonly state: SpecteraState
	private abortController: AbortController | null = null
	private sessionUUID: string | null = null
	private staleSessionUUID: string | null = null
	private readonly dispatcher: Dispatcher
	private variableCache: Record<string, string | number | boolean | undefined> = {}
	private lastLevelUpdateTime = 0
	private isInitializing = false
	private readonly requestQueue: { add: <T>(fn: () => Promise<T>) => Promise<T> }
	private destroyed = false
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null
	private reconnectAttempt = 0
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null
	private lastSSEEventTime = 0
	private subscribeStartTime = 0

	private readonly subscriptionPaths = [
		'/api/audio/inputs',
		'/api/audio/outputs',
		'/api/audio/links',
		'/api/rf/channels',
		'/api/rf/antennas',
		'/api/mts/paired/all',
		'/api/health/psu',
		'/api/health/tempstateoverall',
		'/api/health/fan/FAN_1/errorstate',
		'/api/health/fan/FAN_2/errorstate',
		'/api/health/fan/FAN_3/errorstate',
		'/api/device/identity',
		'/api/device/state',
		'/api/device/site',
		'/api/audio/levels',
		'/api/audio/interface/audionetwork/status',
		'/api/audio/interface/madi1/status',
		'/api/audio/interface/madi2/status',
		'/api/audio/interface/wordclock/status',
	]

	constructor(instance: SpecteraInstance, state: SpecteraState, host: string, password: string) {
		super()
		this.instance = instance
		this.state = state
		this.host = host
		this.password = password
		this.dispatcher = new Agent({
			connect: {
				rejectUnauthorized: false,
				keepAlive: true,
				keepAliveInitialDelay: 10000,
			},
		})
		this.requestQueue = new (PQueue as any)({
			concurrency: 1,
			interval: REQUEST_INTERVAL_MS,
			intervalCap: 1,
		})
	}

	private getAuthHeader(): string {
		const credentials = `controlSennheiser:${this.password}`
		return `Basic ${Buffer.from(credentials).toString('base64')}`
	}

	async sendRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
		return this.requestQueue.add(async () => {
			try {
				return await this.executeRequest<T>(method, path, body)
			} catch (err) {
				this.instance.log(
					'debug',
					`API Request failed for ${method} ${path}: ${err instanceof Error ? err.message : String(err)}`,
				)
				throw err
			}
		})
	}

	private async executeRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
		const url = `https://${this.host}:443/api${path}`
		const options: RequestInit = {
			method,
			headers: {
				Authorization: this.getAuthHeader(),
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			signal: AbortSignal.timeout(10000),
		}

		if (body) {
			options.body = JSON.stringify(body)
		}

		this.instance.log('debug', `API Request: ${method} ${path} ${body ? JSON.stringify(body) : ''}`)

		const response = await fetch(url, { ...options, dispatcher: this.dispatcher } as any)

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error')
			this.instance.log('error', `API Request failed for ${method} ${path}: HTTP ${response.status}: ${errorText}`)
			throw new Error(`HTTP ${response.status}: ${errorText}`)
		}

		if (response.status === 204 || response.headers.get('content-length') === '0') {
			return {} as T
		}

		try {
			return (await response.json()) as T
		} catch {
			return {} as T
		}
	}

	async performLogin(): Promise<void> {
		try {
			await this.getBaseStationState()
		} catch (error) {
			this.instance.log('debug', `Login failed: ${error instanceof Error ? error.message : String(error)}`)
			throw error
		}
	}

	async startMonitoring(): Promise<void> {
		// Register listener BEFORE subscribe() to avoid any race condition where
		// the 'open' SSE event arrives before we start listening
		const subscribedPromise = new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				this.off('subscribed', onSubscribed)
				reject(new Error('Timed out waiting for SSE subscription open event'))
			}, 15000)
			const onSubscribed = () => {
				clearTimeout(timeout)
				resolve()
			}
			this.once('subscribed', onSubscribed)
		})

		await this.subscribe()

		// If the open event never arrives, this throws → initApi catches it → scheduleReconnect
		await subscribedPromise

		await this.setSubscriptionPaths(this.subscriptionPaths).catch((err) => {
			this.instance.log('error', `Failed to set subscription paths: ${err.message}`)
			this.scheduleReconnect()
		})

		await this.fetchInitialState()

		this.startHeartbeat()
	}

	private async fetchInitialState(): Promise<void> {
		this.isInitializing = true

		try {
			const [
				inputs,
				outputs,
				channels,
				antennas,
				devices,
				psu,
				temp,
				fan1,
				fan2,
				fan3,
				identity,
				state,
				site,
				audioLinks,
				audioLevels,
				audioNetwork,
				madi1,
				madi2,
				wordclock,
			] = await Promise.all([
				this.getAudioInputs(),
				this.getAudioOutputs(),
				this.getRfChannels(),
				this.getAntennas(),
				this.getMobileDevices(),
				this.getHealthPsu(),
				this.getHealthTempOverall(),
				this.getHealthFan('FAN_1'),
				this.getHealthFan('FAN_2'),
				this.getHealthFan('FAN_3'),
				this.getBaseStationIdentity(),
				this.getBaseStationState(),
				this.getBaseStationSite(),
				this.getAudioLinks(),
				this.getAudioLevels(),
				this.getAudioNetworkStatus(),
				this.getMadiStatus('madi1'),
				this.getMadiStatus('madi2'),
				this.getWordclockStatus(),
			])

			inputs.forEach((i) => this.state.updateAudioInput(i))
			outputs.forEach((o) => this.state.updateAudioOutput(o))
			channels.forEach((c) => this.state.updateRfChannel(c))
			antennas.forEach((a) => this.state.updateAntenna(a))
			devices.forEach((d) => this.state.updateMobileDevice(d))
			this.state.updatePsuState(psu)
			this.state.updateTempState(temp)
			this.state.updateFanState('FAN_1', fan1)
			this.state.updateFanState('FAN_2', fan2)
			this.state.updateFanState('FAN_3', fan3)
			this.state.updateBaseStationIdentity(identity)
			this.state.updateBaseStationState(state)
			this.state.updateBaseStationSite(site)
			audioLinks.forEach((l) => this.state.updateAudioLink(l))
			this.state.updateAudioLevels(audioLevels)

			this.state.updateAudioNetwork(audioNetwork)
			this.state.updateMadi1(madi1)
			this.state.updateMadi2(madi2)
			this.state.updateWordclock(wordclock)

			this.isInitializing = false

			UpdateVariableDefinitions(this.instance)
			UpdateVariableValues(this.instance)
			UpdatePresets(this.instance)
			UpdateFeedbacks(this.instance)
			UpdateActions(this.instance)
		} catch (error) {
			this.isInitializing = false
			this.instance.log('error', `Initial data fetch failed: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	async disconnect(): Promise<void> {
		this.destroyed = true

		this.stopHeartbeat()

		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}

		// Clean up both the active session and any stale session from a previous reconnect attempt
		for (const uuid of [this.sessionUUID, this.staleSessionUUID].filter(Boolean)) {
			try {
				await this.sendRequest('DELETE', `/ssc/state/subscriptions/${uuid}`)
			} catch (error) {
				this.instance.log(
					'debug',
					`Failed to delete subscription ${uuid} on disconnect: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		}
		this.sessionUUID = null
		this.staleSessionUUID = null

		if (this.abortController) {
			this.abortController.abort()
			this.abortController = null
		}

		this.removeAllListeners()
	}

	private startHeartbeat(): void {
		this.stopHeartbeat()
		this.heartbeatInterval = setInterval(() => void this.runHeartbeat(), 5000)
	}

	private async runHeartbeat(): Promise<void> {
		if (this.destroyed) return
		try {
			await this.getBaseStationState()
			// Detect silent SSE stream death — use subscribe start time as fallback
			// when no SSE events have ever been received (lastSSEEventTime === 0)
			const timeSinceActivity =
				this.lastSSEEventTime > 0 ? Date.now() - this.lastSSEEventTime : Date.now() - this.subscribeStartTime
			if (this.subscribeStartTime > 0 && timeSinceActivity > 60000) {
				this.instance.log('debug', 'No SSE events received in 60s, reconnecting')
				this.stopHeartbeat()
				if (this.abortController) {
					this.abortController.abort()
					this.abortController = null
				}
				this.scheduleReconnect()
				return
			}
		} catch (_err) {
			this.instance.log('warn', 'Connection lost to Spectera.')
			this.stopHeartbeat()
			if (this.abortController) {
				this.abortController.abort()
				this.abortController = null
			}
			this.scheduleReconnect()
		}
	}

	private stopHeartbeat(): void {
		if (this.heartbeatInterval !== null) {
			clearInterval(this.heartbeatInterval)
			this.heartbeatInterval = null
		}
	}

	scheduleReconnect(): void {
		if (this.destroyed) return
		if (this.reconnectTimer !== null) return

		this.stopHeartbeat()

		const delay = Math.min(500 * Math.pow(2, this.reconnectAttempt), 30000)
		this.reconnectAttempt++
		this.instance.log('debug', `Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempt})`)
		this.reconnectTimer = setTimeout(() => void this.runReconnect(), delay)
	}

	private async runReconnect(): Promise<void> {
		this.reconnectTimer = null
		if (this.destroyed) return
		try {
			// Abort the SSE stream locally so we stop receiving events
			if (this.abortController) {
				this.abortController.abort()
				this.abortController = null
			}

			// Promote current session to stale so it survives failed reconnect attempts.
			// We can't DELETE it until the device is reachable again
			if (this.sessionUUID) {
				this.staleSessionUUID = this.sessionUUID
				this.sessionUUID = null
			}

			await this.performLogin()

			// Device is reachable — clean up the stale session before opening a new one
			if (this.staleSessionUUID) {
				try {
					await fetch(`https://${this.host}:443/api/ssc/state/subscriptions/${this.staleSessionUUID}`, {
						method: 'DELETE',
						headers: { Authorization: this.getAuthHeader() },
						signal: AbortSignal.timeout(5000),
						dispatcher: this.dispatcher,
					} as any)
					this.instance.log('debug', `Cleaned up stale subscription session ${this.staleSessionUUID}`)
				} catch (err) {
					this.instance.log(
						'debug',
						`Failed to delete stale subscription session ${this.staleSessionUUID}: ${err instanceof Error ? err.message : String(err)}`,
					)
				}
				this.staleSessionUUID = null
			}

			const subscribedPromise = new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					this.off('subscribed', onSubscribed)
					reject(new Error('Timed out waiting for SSE open event on reconnect'))
				}, 15000)
				const onSubscribed = () => {
					clearTimeout(timeout)
					resolve()
				}
				this.once('subscribed', onSubscribed)
			})

			await this.subscribe()
			await subscribedPromise

			await this.setSubscriptionPaths(this.subscriptionPaths).catch((err) => {
				this.instance.log('error', `Failed to set subscription paths on reconnect: ${err.message}`)
				this.scheduleReconnect()
			})

			await this.fetchInitialState()
			this.startHeartbeat()
			this.reconnectAttempt = 0
			this.instance.updateStatus(InstanceStatus.Ok)
			this.instance.log('info', 'Reconnected to Spectera successfully')
		} catch (err) {
			this.instance.log('debug', `Reconnect failed: ${err instanceof Error ? err.message : String(err)}`)
			this.instance.updateStatus(InstanceStatus.ConnectionFailure)
			this.scheduleReconnect()
		}
	}

	private async subscribe(): Promise<void> {
		if (this.abortController) {
			this.abortController.abort()
		}
		this.abortController = new AbortController()
		this.lastSSEEventTime = 0
		this.subscribeStartTime = Date.now()

		const url = `https://${this.host}:443/api/ssc/state/subscriptions`
		const options: RequestInit = {
			method: 'GET',
			headers: {
				Authorization: this.getAuthHeader(),
				Accept: 'text/event-stream',
			},
			signal: this.abortController.signal,
		}

		this.instance.log('debug', `API Request: GET ${url}`)

		try {
			const response = await fetch(url, { ...options, dispatcher: this.dispatcher } as any)
			if (!response.ok) {
				this.instance.log('warn', `Failed to start subscription: ${response.statusText}`)
				throw new Error(`Failed to start subscription: ${response.statusText}`)
			}

			const reader = response.body?.getReader()
			if (!reader) {
				this.instance.log('warn', 'Response body is not readable')
				return
			}

			this.processStream(reader)
				.then(() => {
					if (!this.destroyed) {
						this.stopHeartbeat()
						this.scheduleReconnect()
					}
				})
				.catch((err) => {
					if (err.name !== 'AbortError') {
						this.instance.log('debug', `SSE Stream error: ${err.message}`)
						if (!this.destroyed) {
							this.stopHeartbeat()
							this.scheduleReconnect()
						}
					}
				})
		} catch (error) {
			this.instance.log('error', `Subscription failed: ${error instanceof Error ? error.message : String(error)}`)
			throw error
		}
	}

	private async processStream(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
		const decoder = new TextDecoder()
		let buffer = ''

		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })
			const parts = buffer.split('\n\n')
			buffer = parts.pop() || ''

			for (const part of parts) {
				this.handleSSEEvent(part)
			}
		}
	}

	private handleSSEEvent(eventString: string): void {
		this.lastSSEEventTime = Date.now()
		const lines = eventString.split('\n')
		let eventType = 'message'
		let data = ''

		for (const line of lines) {
			if (line.startsWith('event:')) {
				eventType = line.replace('event:', '').trim()
			} else if (line.startsWith('data:')) {
				data += line.replace('data:', '').trim()
			}
		}

		if (data) {
			try {
				const jsonData = JSON.parse(data)
				if (eventType === 'open' && jsonData.sessionUUID) {
					this.sessionUUID = jsonData.sessionUUID
					this.instance.log('debug', `Subscription opened with sessionUUID: ${this.sessionUUID}`)
					this.emit('subscribed', this.sessionUUID)
				} else {
					this.processInternalUpdate(eventType, jsonData)
				}
			} catch (_e) {
				this.instance.log('debug', `Failed to parse SSE data: ${data}`)
			}
		}
	}

	private handleStateUpdate<T>(
		idPrefix: string,
		oldState: T | undefined,
		newState: T,
		map: StateMap<T>,
		changedVariables: Record<string, VariableValue>,
		feedbacksToCheck: Set<string>,
	) {
		const keysToCheck = oldState
			? (Object.keys(newState as object) as (keyof T)[])
			: (Object.keys(map as object) as (keyof T)[])

		for (const key of keysToCheck) {
			const entry = map[key]
			if (!entry) continue

			const newValue = newState[key]

			if (!oldState || oldState[key] !== newValue) {
				if (entry.feedback) {
					const ids = Array.isArray(entry.feedback) ? entry.feedback : [entry.feedback]
					for (const id of ids) feedbacksToCheck.add(id)
				}

				if (entry.variableSuffixes?.length) {
					for (const { suffix, valueFn } of entry.variableSuffixes) {
						const fullVarName = `${idPrefix}${suffix}`
						const val = valueFn(newValue, newState)
						if (this.variableCache[fullVarName] !== val) {
							changedVariables[fullVarName] = val
							this.variableCache[fullVarName] = val
						}
					}
				} else if (entry.variable && entry.valueFn) {
					// Handle absolute vs relative variable names logic if needed, but usually we pass prefix
					const fullVarName = `${idPrefix}${entry.variable}`
					const val = entry.valueFn(newValue, newState)
					if (this.variableCache[fullVarName] !== val) {
						changedVariables[fullVarName] = val
						this.variableCache[fullVarName] = val
					}
				}
			}
		}
	}

	private processAudioLevels(
		levels: AudioLevels,
		changedVariables: Record<string, string | number | boolean | undefined>,
	): void {
		this.state.updateAudioLevels(levels)

		if (this.isInitializing) return

		const now = Date.now()
		if (now - this.lastLevelUpdateTime >= 500) {
			this.lastLevelUpdateTime = now

			const interfaces: (keyof AudioLevels)[] = ['madi1In', 'madi2In', 'danteIn', 'madi1Out', 'madi2Out', 'danteOut']

			for (const iface of interfaces) {
				const levelData = levels[iface] as AudioLevel | undefined
				if (levelData) {
					const ifaceName = iface.replace(/([A-Z])/g, '_$1').toLowerCase()

					levelData.peak.forEach((val, index) => {
						const varName = `audio_level_${ifaceName}_${index + 1}_peak`
						if (this.variableCache[varName] !== val) {
							changedVariables[varName] = val
							this.variableCache[varName] = val
						}
					})
					levelData.rms.forEach((val, index) => {
						const varName = `audio_level_${ifaceName}_${index + 1}_rms`
						if (this.variableCache[varName] !== val) {
							changedVariables[varName] = val
							this.variableCache[varName] = val
						}
					})
				}
			}
			this.instance.checkFeedbacks('audioLevelThreshold')
		}
	}

	private processInternalUpdate(_eventType: string, data: any): void {
		let structureChanged = false
		const keys = Object.keys(data)
		const changedVariables: Record<string, string | number | boolean | undefined> = {}
		const feedbacksToCheck = new Set<string>()

		for (const key of keys) {
			const value = data[key]

			if (key.startsWith('/api/audio/inputs/')) {
				const oldState = this.state.audioInputs.get(value.inputId)
				this.state.updateAudioInput(value)
				const displayId = value.inputId + 1
				this.handleStateUpdate(
					`audio_input_${displayId}_`,
					oldState,
					value,
					AudioInputStateMap,
					changedVariables,
					feedbacksToCheck,
				)
				changedVariables[`audio_input_${displayId}_iem_link_devices`] = getAudioInputIemLinkDevices(
					value,
					this.state.mobileDevices,
				)
				structureChanged = !oldState
			} else if (key.startsWith('/api/audio/outputs/')) {
				const oldState = this.state.audioOutputs.get(value.outputId)
				this.state.updateAudioOutput(value)
				const displayId = value.outputId + 1
				this.handleStateUpdate(
					`audio_output_${displayId}_`,
					oldState,
					value,
					AudioOutputStateMap,
					changedVariables,
					feedbacksToCheck,
				)
				changedVariables[`audio_output_${displayId}_source`] = getAudioOutputSourceName(value, this.state.mobileDevices)
				changedVariables[`audio_output_${displayId}_destinations`] = getAudioOutputActiveChannels(value)
				structureChanged = !oldState
			} else if (key.startsWith('/api/audio/links/')) {
				if (value === null) {
					// Deletion
					const match = key.match(/\/api\/audio\/links\/(\d+)/)
					if (match && match[1]) {
						const linkId = parseInt(match[1], 10)
						this.state.removeAudioLink(linkId)
						structureChanged = true
					}
				} else {
					const oldState = this.state.audioLinks.get(value.audiolinkId)
					this.state.updateAudioLink(value)
					structureChanged = !oldState
				}
			} else if (key.startsWith('/api/rf/channels/')) {
				const oldState = this.state.rfChannels.get(value.rfChannelId)
				this.state.updateRfChannel(value)
				const displayId = value.rfChannelId + 1
				this.handleStateUpdate(
					`rf_channel_${displayId}_`,
					oldState,
					value,
					RfChannelStateMap,
					changedVariables,
					feedbacksToCheck,
				)
				structureChanged = !oldState
			} else if (key.startsWith('/api/rf/antennas/')) {
				const antenna: Antenna = {
					...value,
					interferenceTotalPower: value.interference?.totalPower,
				}
				const oldState = this.state.antennas.get(antenna.antennaPortId)
				this.state.updateAntenna(antenna)
				const port = antenna.antennaPortId.replace(/[^a-zA-Z0-9_-]/g, '_')
				this.handleStateUpdate(`dad_${port}_`, oldState, antenna, AntennaStateMap, changedVariables, feedbacksToCheck)
				//Frequency Lookup
				const frequencyVar = `dad_${port}_frequency`
				const frequencyVal = getAntennaFrequency(antenna, this.state.rfChannels)
				if (this.variableCache[frequencyVar] !== frequencyVal) {
					changedVariables[frequencyVar] = frequencyVal === 'Scan' || frequencyVal === 'Off' ? '-' : `${frequencyVal}`
					this.variableCache[frequencyVar] = frequencyVal
				}
				//Main Interferers Lookup
				const mainInterferersVar = `dad_${port}_main_interferers`
				if (antenna.interference?.mainInterferers && antenna.interference.mainInterferers.length > 0) {
					const mainInterferersVal = antenna.interference?.mainInterferers
						?.map((i) => `${(i.frequency / 1000).toFixed(0)}MHz\\n(${i.power}dBm)`)
						.join('\\n')
					if (this.variableCache[mainInterferersVar] !== mainInterferersVal) {
						changedVariables[mainInterferersVar] = mainInterferersVal
						this.variableCache[mainInterferersVar] = mainInterferersVal
					}
				} else {
					if (this.variableCache[mainInterferersVar] !== 'None') {
						changedVariables[mainInterferersVar] = 'None'
						this.variableCache[mainInterferersVar] = 'None'
					}
				}
				structureChanged = !oldState
			} else if (key.startsWith('/api/mts/paired/all/')) {
				const oldState = this.state.mobileDevices.get(value.mtUid)
				this.state.updateMobileDevice(value)
				const type = value.type
				const serial = value.serial
				const prefix = `${type}_${serial}_`
				this.handleStateUpdate(
					prefix,
					oldState as (SEKDevice & SKMDevice) | undefined,
					value,
					MobileDeviceStateMap,
					changedVariables,
					feedbacksToCheck,
				)
				structureChanged = !oldState || oldState.name !== value.name
				// Recompute iem_link_devices for any audio input affected by this device's link change
				const oldIemLinkId = oldState?.type === MtType.SEK ? oldState.iemAudiolinkId : undefined
				const newIemLinkId = value.iemAudiolinkId
				if (oldIemLinkId !== newIemLinkId) {
					for (const input of this.state.audioInputs.values()) {
						if (
							(newIemLinkId !== undefined && input.iemAudiolinkId === newIemLinkId) ||
							(oldIemLinkId !== undefined && input.iemAudiolinkId === oldIemLinkId)
						) {
							const displayId = input.inputId + 1
							changedVariables[`audio_input_${displayId}_iem_link_devices`] = getAudioInputIemLinkDevices(
								input,
								this.state.mobileDevices,
							)
						}
					}
				}
			} else if (key === '/api/health/psu') {
				const oldState = { ...this.state.health.psu }
				this.state.updatePsuState(value)
				this.handleStateUpdate('', oldState, value, PsuStateMap, changedVariables, feedbacksToCheck)
			} else if (key === '/api/health/tempstateoverall') {
				const oldState = { ...this.state.health.temp }
				this.state.updateTempState(value)
				this.handleStateUpdate('', oldState, value, TempStateMap, changedVariables, feedbacksToCheck)
			} else if (key.startsWith('/api/health/fan/')) {
				// Extract fan ID from path: /api/health/fan/{fanId}/errorstate
				const match = key.match(/\/api\/health\/fan\/(.+)\/errorstate/)
				if (match && match[1]) {
					const fanId = match[1]
					const oldState = this.state.health.fans[fanId]
					const fanState: FanState = {
						fanId,
						errorState: value.errorState ?? value,
					}
					this.state.updateFanState(fanId, fanState)
					const fanNumber = fanId.split('_')[1]
					this.handleStateUpdate(
						`health_fan_${fanNumber}_`,
						oldState,
						fanState,
						FanStateMap,
						changedVariables,
						feedbacksToCheck,
					)
				}
			} else if (key === '/api/device/identity') {
				const oldState = this.state.basestation.identity ? { ...this.state.basestation.identity } : undefined
				this.state.updateBaseStationIdentity(value)
				this.handleStateUpdate('', oldState, value, BaseStationIdentityMap, changedVariables, feedbacksToCheck)
			} else if (key === '/api/device/state') {
				const oldState = this.state.basestation.state ? { ...this.state.basestation.state } : undefined
				this.state.updateBaseStationState(value)
				this.handleStateUpdate('', oldState, value, BaseStationStateMap, changedVariables, feedbacksToCheck)
			} else if (key === '/api/device/site') {
				const oldState = this.state.basestation.site ? { ...this.state.basestation.site } : undefined
				this.state.updateBaseStationSite(value)
				this.handleStateUpdate('', oldState, value, BaseStationSiteMap, changedVariables, feedbacksToCheck)
			} else if (key === '/api/audio/levels') {
				this.processAudioLevels(value as AudioLevels, changedVariables)
			} else if (key === '/api/audio/interface/audionetwork/status') {
				const oldState = this.state.audioNetwork ? { ...this.state.audioNetwork } : undefined
				this.state.updateAudioNetwork(value)
				this.handleStateUpdate('dante_', oldState, value, AudioNetworkStateMap, changedVariables, feedbacksToCheck)
			} else if (key === '/api/audio/interface/madi1/status') {
				const oldState = this.state.madi1 ? { ...this.state.madi1 } : undefined
				this.state.updateMadi1(value)
				// Handle top level
				this.handleStateUpdate('madi_1_', oldState, value, MadiStateMap, changedVariables, feedbacksToCheck)
				// Handle input status
				this.handleStateUpdate(
					'madi_1_',
					oldState?.inputStatus,
					value.inputStatus,
					MadiInputStateMap,
					changedVariables,
					feedbacksToCheck,
				)
				// Handle output status
				this.handleStateUpdate(
					'madi_1_',
					oldState?.outputStatus,
					value.outputStatus,
					MadiOutputStateMap,
					changedVariables,
					feedbacksToCheck,
				)
			} else if (key === '/api/audio/interface/madi2/status') {
				const oldState = this.state.madi2 ? { ...this.state.madi2 } : undefined
				this.state.updateMadi2(value)
				// Handle top level
				this.handleStateUpdate('madi_2_', oldState, value, MadiStateMap, changedVariables, feedbacksToCheck)
				// Handle input status
				this.handleStateUpdate(
					'madi_2_',
					oldState?.inputStatus,
					value.inputStatus,
					MadiInputStateMap,
					changedVariables,
					feedbacksToCheck,
				)
				// Handle output status
				this.handleStateUpdate(
					'madi_2_',
					oldState?.outputStatus,
					value.outputStatus,
					MadiOutputStateMap,
					changedVariables,
					feedbacksToCheck,
				)
			} else if (key === '/api/audio/interface/wordclock/status') {
				const oldState = this.state.wordclock ? { ...this.state.wordclock } : undefined
				this.state.updateWordclock(value)
				// Handle input status
				this.handleStateUpdate(
					'wordclock_',
					oldState?.inputStatus,
					value.inputStatus,
					WordclockInputStateMap,
					changedVariables,
					feedbacksToCheck,
				)
				// Handle output status
				this.handleStateUpdate(
					'wordclock_',
					oldState?.outputStatus,
					value.outputStatus,
					WordclockOutputStateMap,
					changedVariables,
					feedbacksToCheck,
				)
			}
		}

		if (structureChanged && !this.isInitializing) {
			UpdateVariableDefinitions(this.instance)
			UpdatePresets(this.instance)
			UpdateFeedbacks(this.instance)
			UpdateActions(this.instance)
			UpdateVariableValues(this.instance)
		}

		if (!this.isInitializing) {
			if (Object.keys(changedVariables).length > 0) {
				this.instance.setVariableValues(changedVariables)
				/* const loggableVariables = Object.fromEntries(
					Object.entries(changedVariables).filter(([key]) => !key.includes('audio_level')),
				)
				if (Object.keys(loggableVariables).length > 0) {
					console.log('Changed variables:', loggableVariables)
				} */
			}

			if (feedbacksToCheck.size > 0) {
				this.instance.checkFeedbacks(...Array.from(feedbacksToCheck))
			}
		}
	}

	async setSubscriptionPaths(paths: string[]): Promise<void> {
		if (!this.sessionUUID) {
			this.instance.log('debug', 'No active session, skipping subscription paths update')
			return
		}
		await this.sendRequest('PUT', `/ssc/state/subscriptions/${this.sessionUUID}/add`, paths)
	}

	async getAudioInputs(): Promise<AudioInput[]> {
		return this.sendRequest<AudioInput[]>('GET', '/audio/inputs')
	}

	async setAudioInput(inputId: number, state: Partial<AudioInput>): Promise<void> {
		const currentInput = this.state.audioInputs.get(inputId)
		if (!currentInput) {
			throw new Error(`Audio input ${inputId} not found`)
		}

		const payload = {
			...state,
			inputId,
		}

		await this.sendRequest('PUT', `/audio/inputs/${inputId}`, payload)
	}

	async getAudioOutputs(): Promise<AudioOutput[]> {
		return this.sendRequest<AudioOutput[]>('GET', '/audio/outputs')
	}

	async setAudioOutput(outputId: number, state: Partial<AudioOutput>): Promise<void> {
		const currentOutput = this.state.audioOutputs.get(outputId)
		if (!currentOutput) {
			throw new Error(`Audio output ${outputId} not found`)
		}

		const payload = {
			...state,
			outputId,
		}
		await this.sendRequest('PUT', `/audio/outputs/${outputId}`, payload)
	}

	async getAudioLinks(): Promise<AudioLink[]> {
		return this.sendRequest<AudioLink[]>('GET', '/audio/links')
	}

	async getRfChannels(): Promise<RfChannel[]> {
		return this.sendRequest<RfChannel[]>('GET', '/rf/channels')
	}

	async setRfChannel(channelId: string, state: Partial<RfChannel>): Promise<void> {
		await this.sendRequest('PUT', `/rf/channels/${channelId}`, state)
	}

	async getAntennas(): Promise<Antenna[]> {
		return this.sendRequest<Antenna[]>('GET', '/rf/antennas')
	}

	async setAntenna(antennaPortId: string, state: Partial<Antenna>): Promise<void> {
		await this.sendRequest('PUT', `/rf/antennas/${antennaPortId}`, state)
	}

	async setMobileDevice(mtUid: number, state: Partial<MobileDevice>): Promise<void> {
		const currentDevice = this.state.mobileDevices.get(mtUid)
		if (!currentDevice) {
			throw new Error(`Mobile device ${mtUid} not found`)
		}

		const payload = {
			...state,
			mtUid,
			type: currentDevice.type,
		}

		await this.sendRequest('PUT', `/mts/paired/all/${mtUid}`, payload)
	}

	async getMobileDevices(): Promise<MobileDevice[]> {
		return this.sendRequest<MobileDevice[]>('GET', '/mts/paired/all')
	}

	async getHealthPsu(): Promise<PsuState> {
		return this.sendRequest<PsuState>('GET', '/health/psu')
	}

	async getHealthTempOverall(): Promise<TempState> {
		return this.sendRequest<TempState>('GET', '/health/tempstateoverall')
	}

	async getHealthFan(fanId: string): Promise<FanState> {
		const errorState = await this.sendRequest<any>('GET', `/health/fan/${fanId}/errorstate`)
		return {
			fanId,
			errorState: errorState.errorState ?? errorState,
		}
	}

	async getBaseStationIdentity(): Promise<BaseStationIdentity> {
		return this.sendRequest<BaseStationIdentity>('GET', '/device/identity')
	}

	async getBaseStationState(): Promise<BaseStationState> {
		return this.sendRequest<BaseStationState>('GET', '/device/state')
	}

	async getBaseStationSite(): Promise<BaseStationSite> {
		return this.sendRequest<BaseStationSite>('GET', '/device/site')
	}

	async getAudioLevels(): Promise<AudioLevels> {
		return this.sendRequest<AudioLevels>('GET', '/audio/levels')
	}

	async getAudioNetworkStatus(): Promise<InterfaceStatusAudioNetwork> {
		return this.sendRequest<InterfaceStatusAudioNetwork>('GET', '/audio/interface/audionetwork/status')
	}

	async getMadiStatus(interfaceId: 'madi1' | 'madi2'): Promise<InterfaceStatusMadi> {
		return this.sendRequest<InterfaceStatusMadi>('GET', `/audio/interface/${interfaceId}/status`)
	}

	async getWordclockStatus(): Promise<InterfaceStatusWordclock> {
		return this.sendRequest<InterfaceStatusWordclock>('GET', '/audio/interface/wordclock/status')
	}

	async createAudioLink(config: { modeId: number; rfChannelId: number }): Promise<number> {
		const result = await this.sendRequest<AudioLink>('POST', '/audio/links', config)
		return result.audiolinkId
	}

	async updateAudioLink(config: { audiolinkId: number; modeId: number }): Promise<void> {
		await this.sendRequest('PUT', `/audio/links/${config.audiolinkId}`, config)
	}

	async setMobileDeviceAudioLinkMode(mtUid: number, link: 'iem' | 'mic', modeId: number): Promise<void> {
		const mobileDevice = this.state.mobileDevices.get(mtUid)
		if (!mobileDevice) {
			this.instance.log('warn', 'Set Audio Link Mode: Mobile device not found')
			return
		}

		if (link === 'iem') {
			if (mobileDevice.type !== MtType.SEK) {
				this.instance.log('warn', 'Set Audio Link Mode: IEM link is only available on SEK devices')
				return
			}
			const audiolinkId = mobileDevice.iemAudiolinkId
			if (!isActiveAudioLinkId(audiolinkId)) {
				this.instance.log('warn', 'Set Audio Link Mode: No active IEM audio link on this device')
				return
			}
			try {
				await this.updateAudioLink({ audiolinkId: audiolinkId!, modeId })
				this.instance.log('debug', `Set IEM audio link ${audiolinkId} mode to ${modeId}`)
			} catch (error) {
				this.instance.log('warn', `Set Audio Link Mode: Failed to update IEM link: ${error}`)
			}
			return
		}

		const audiolinkId = mobileDevice.micAudiolinkId
		if (!isActiveAudioLinkId(audiolinkId)) {
			this.instance.log('warn', 'Set Audio Link Mode: No active Mic audio link on this device')
			return
		}
		try {
			await this.updateAudioLink({ audiolinkId: audiolinkId!, modeId })
			this.instance.log('debug', `Set Mic audio link ${audiolinkId} mode to ${modeId}`)
		} catch (error) {
			this.instance.log('warn', `Set Audio Link Mode: Failed to update Mic link: ${error}`)
		}
	}

	async routeAudioInputToMobileDevice(inputId: number, mtUid: number, modeId: number): Promise<void> {
		const audioInput = this.state.audioInputs.get(inputId)
		const mobileDevice = this.state.mobileDevices.get(mtUid)

		if (!audioInput || !mobileDevice) {
			this.instance.log('warn', 'Audio Routing: Input or Mobile Device not found')
			return
		}

		let audiolinkId = audioInput.iemAudiolinkId

		if (audiolinkId < 0) {
			// Create new Audio Link
			if (mobileDevice.rfChannelId === undefined) {
				this.instance.log('warn', 'Audio Routing: Mobile Device has no RF Channel assigned')
				return
			}

			try {
				audiolinkId = await this.createAudioLink({
					modeId: modeId,
					rfChannelId: mobileDevice.rfChannelId,
				})
				this.instance.log('debug', `Created new Audio Link ${audiolinkId}`)

				// Assign to Audio Input first
				await this.setAudioInput(inputId, {
					iemAudiolinkId: audiolinkId,
				} as Partial<AudioInput>)
			} catch (error) {
				this.instance.log('error', `Audio Routing: Failed to create Audio Link: ${error}`)
				return
			}
		} else {
			// Existing Audio Link, check if mode needs update
			/* const audioLink = this.state.audioLinks.get(audiolinkId)
			if (audioLink && audioLink.modeId !== (modeId as AudiolinkModeId)) {
				try {
					await this.updateAudioLink({ audiolinkId, modeId })
					this.instance.log('debug', `Updated Audio Link ${audiolinkId} mode to ${modeId}`)
				} catch (error) {
					this.instance.log('error', `Audio Routing: Failed to update Audio Link mode: ${error}`)
				}
			} */
		}

		// Assign to Mobile Device
		try {
			await this.setMobileDevice(mtUid, {
				iemAudiolinkId: audiolinkId,
			} as Partial<MobileDevice>)
			this.instance.log(
				'debug',
				`Routed Audio Input ${inputId} to Mobile Device ${mtUid} via Audio Link ${audiolinkId}`,
			)
		} catch (error) {
			this.instance.log('warn', `Audio Routing: Failed to assign Audio Link to Mobile Device: ${error}`)
		}
	}

	async routeMobileDeviceToAudioOutput(mtUid: number, outputId: number, modeId: number): Promise<void> {
		const audioOutput = this.state.audioOutputs.get(outputId)
		const mobileDevice = this.state.mobileDevices.get(mtUid)

		if (!audioOutput || !mobileDevice) {
			this.instance.log('warn', 'Audio Routing: Output or Mobile Device not found')
			return
		}

		let audiolinkId = mobileDevice.micAudiolinkId
		if (isActiveAudioLinkId(audiolinkId)) {
			const existingId = audiolinkId!
			this.instance.log('debug', `Routing: Using existing Audio Link ${existingId} from Mobile Device`)
			const linkState = this.state.audioLinks.get(existingId)
			if (linkState === undefined || Number(linkState.modeId) !== Number(modeId)) {
				try {
					await this.updateAudioLink({ audiolinkId: existingId, modeId })
					this.instance.log('debug', `Routing: Updated Audio Link ${existingId} mode to ${modeId}`)
				} catch (error) {
					this.instance.log('warn', `Audio Routing: Failed to update Audio Link mode: ${error}`)
				}
			}
		} else {
			if (mobileDevice.rfChannelId === undefined) {
				this.instance.log('warn', 'Audio Routing: Mobile Device has no RF Channel assigned')
				return
			}

			try {
				audiolinkId = await this.createAudioLink({
					modeId: modeId,
					rfChannelId: mobileDevice.rfChannelId,
				})
				this.instance.log('debug', `Created new Audio Link ${audiolinkId}`)
			} catch (error) {
				this.instance.log('warn', `Audio Routing: Failed to create Audio Link: ${error}`)
				return
			}
		}

		const oldLinkID = audioOutput.micAudiolinkId
		if (oldLinkID && oldLinkID !== -1 && oldLinkID !== audiolinkId) {
			let isOldLinkShared = false
			for (const otherOutput of this.state.audioOutputs.values()) {
				if (otherOutput.outputId !== outputId && otherOutput.micAudiolinkId === oldLinkID) {
					isOldLinkShared = true
					break
				}
			}

			if (!isOldLinkShared) {
				for (const otherDevice of this.state.mobileDevices.values()) {
					if (otherDevice.micAudiolinkId === oldLinkID) {
						this.instance.log(
							'debug',
							`Audio Routing: Unlinking device ${otherDevice.mtUid} from Audio Link ${oldLinkID}`,
						)
						try {
							await this.setMobileDevice(otherDevice.mtUid, {
								micAudiolinkId: -1,
							} as Partial<MobileDevice>)
						} catch (error) {
							this.instance.log('warn', `Audio Routing: Failed to unlink device ${otherDevice.mtUid}: ${error}`)
						}
					}
				}
				try {
					await this.updateAudioLink({
						audiolinkId: oldLinkID,
						modeId: MicAudiolinkMode['None'],
					})
					this.instance.log('debug', `Audio Routing: Set unused link ${oldLinkID} to Empty`)
				} catch (error) {
					this.instance.log('warn', `Audio Routing: Failed to clear old link ${oldLinkID}: ${error}`)
				}
			}
		}

		try {
			if (mobileDevice.micAudiolinkId !== audiolinkId) {
				await this.setMobileDevice(mtUid, {
					micAudiolinkId: audiolinkId,
				} as Partial<MobileDevice>)
			}
		} catch (error) {
			this.instance.log('warn', `Audio Routing: Failed to assign Audio Link to Mobile Device: ${error}`)
		}

		try {
			if (audioOutput.micAudiolinkId !== audiolinkId) {
				await this.setAudioOutput(outputId, {
					micAudiolinkId: audiolinkId,
				} as Partial<AudioOutput>)
			}
			this.instance.log(
				'debug',
				`Routed Mobile Device ${mtUid} to Audio Output ${outputId} via Audio Link ${audiolinkId}`,
			)
		} catch (error) {
			this.instance.log('warn', `Audio Routing: Failed to assign Audio Link to Audio Output: ${error}`)
		}
	}

	async copyMobileDeviceSettings(sourceMtUid: number, targetMtUid: number): Promise<void> {
		const sourceDevice = this.state.mobileDevices.get(sourceMtUid)
		const targetDevice = this.state.mobileDevices.get(targetMtUid)

		if (!sourceDevice || !targetDevice) {
			this.instance.log('warn', 'Copy Settings: Source or Target Mobile Device not found')
			return
		}

		if (sourceDevice.mtUid === targetDevice.mtUid) {
			this.instance.log('warn', 'Copy Settings: Source and Target are the same device')
			return
		}

		const sameType = sourceDevice.type === targetDevice.type
		if (!sameType) {
			this.instance.log(
				'info',
				`Copy Settings: Device types differ (${sourceDevice.type} → ${targetDevice.type}). Copying shared settings only; type-specific parameters are skipped.`,
			)
		}

		const desiredMicId = isActiveAudioLinkId(sourceDevice.micAudiolinkId) ? sourceDevice.micAudiolinkId! : -1

		// SEK target: copy source SEK’s IEM link id, or -1 when source has no IEM. Applied via a dedicated PUT
		// after the bulk clone. Source IEM is never cleared so both devices may reference the same link briefly.
		let desiredIemId: number | undefined
		if (targetDevice.type === MtType.SEK) {
			if (sourceDevice.type === MtType.SEK && isActiveAudioLinkId(sourceDevice.iemAudiolinkId)) {
				desiredIemId = sourceDevice.iemAudiolinkId!
			} else {
				desiredIemId = -1
			}
		}

		const payload: Partial<MobileDevice> = {
			name: sourceDevice.name,
			ledBrightness: sourceDevice.ledBrightness,
			micPreampGain: sourceDevice.micPreampGain,
			micAudiolinkId: desiredMicId,
			rfChannelId: sourceDevice.rfChannelId,
			identify: sourceDevice.identify,
			reverseIdentify: sourceDevice.reverseIdentify,
			sleep: sourceDevice.sleep,
		}

		if (typeof sourceDevice.micTestToneEnabled === 'boolean') {
			payload.micTestToneEnabled = sourceDevice.micTestToneEnabled
		}
		if (typeof sourceDevice.micTestToneLevel === 'number') {
			payload.micTestToneLevel = sourceDevice.micTestToneLevel
		}

		if (sameType && sourceDevice.type === MtType.SEK) {
			const sekPayload = payload as Partial<SEKDevice>
			sekPayload.headphoneVolume = sourceDevice.headphoneVolume
			sekPayload.headphoneBalance = sourceDevice.headphoneBalance
			sekPayload.headphoneVolumeLimit = sourceDevice.headphoneVolumeLimit
			sekPayload.micLineSelection = sourceDevice.micLineSelection
			sekPayload.micLineSelectionAutoValue = sourceDevice.micLineSelectionAutoValue
			sekPayload.micLowCutHz = sourceDevice.micLowCutHz
			sekPayload.cableEmulation = sourceDevice.cableEmulation
		} else if (sameType && sourceDevice.type === MtType.SKM) {
			const skmPayload = payload as Partial<SKMDevice>
			skmPayload.micLowCutHz = sourceDevice.micLowCutHz
			skmPayload.commandBehavior = sourceDevice.commandBehavior
		}

		try {
			// Drop the target's mic link first if it would conflict with the link we are moving from the source.
			if (isActiveAudioLinkId(targetDevice.micAudiolinkId) && targetDevice.micAudiolinkId !== desiredMicId) {
				try {
					this.instance.log(
						'debug',
						`Copy Settings: Clearing target mic link ${targetDevice.micAudiolinkId} before reassignment`,
					)
					await this.setMobileDevice(targetMtUid, { micAudiolinkId: -1 } as Partial<MobileDevice>)
				} catch (err) {
					this.instance.log(
						'warn',
						`Copy Settings: Failed to clear mic link on target: ${err instanceof Error ? err.message : String(err)}`,
					)
				}
			}

			if (isActiveAudioLinkId(sourceDevice.micAudiolinkId)) {
				try {
					this.instance.log(
						'debug',
						`Copy Settings: Unassigning mic link ${sourceDevice.micAudiolinkId} from source (move to target)`,
					)
					await this.setMobileDevice(sourceMtUid, { micAudiolinkId: -1 } as Partial<MobileDevice>)
				} catch (err) {
					this.instance.log(
						'warn',
						`Copy Settings: Failed to unassign mic link from source: ${err instanceof Error ? err.message : String(err)}`,
					)
				}
			}

			if (targetDevice.type === MtType.SEK && desiredIemId !== undefined) {
				const targetIem = targetDevice.iemAudiolinkId
				if (isActiveAudioLinkId(targetIem) && targetIem !== desiredIemId) {
					this.instance.log(
						'debug',
						`Copy Settings: Clearing target IEM link ${targetIem} before applying copied IEM (source unchanged)`,
					)
					await this.setMobileDevice(targetMtUid, { iemAudiolinkId: -1 } as Partial<MobileDevice>)
				}
			}

			await this.setMobileDevice(targetMtUid, payload)

			if (targetDevice.type === MtType.SEK && desiredIemId !== undefined) {
				this.instance.log(
					'debug',
					`Copy Settings: Applying IEM link ${desiredIemId} to target (dedicated PUT; source IEM not cleared)`,
				)
				await this.setMobileDevice(targetMtUid, { iemAudiolinkId: desiredIemId } as Partial<MobileDevice>)
			}

			this.instance.log(
				'debug',
				`Copy Settings: Cloned settings from ${sourceDevice.name} to ${targetDevice.name} (mic ${desiredMicId}, IEM target ${desiredIemId ?? 'n/a'})`,
			)
		} catch (error) {
			this.instance.log('warn', `Copy Settings: Failed to apply settings: ${error}`)
		}
	}

	async copyIemAudioLink(sourceMtUid: number, targetMtUid: number): Promise<void> {
		const sourceDevice = this.state.mobileDevices.get(sourceMtUid)
		const targetDevice = this.state.mobileDevices.get(targetMtUid)

		if (!sourceDevice || !targetDevice) {
			this.instance.log('warn', 'Copy IEM Mix: Source or Target Mobile Device not found')
			return
		}

		const iemAudiolinkId = sourceDevice.type === MtType.SEK ? sourceDevice.iemAudiolinkId : undefined

		if (sourceDevice.rfChannelId !== targetDevice.rfChannelId) {
			this.instance.log('warn', 'Copy IEM Mix: Devices are on different RF Channels, this might fail')
		}

		try {
			await this.setMobileDevice(targetMtUid, {
				iemAudiolinkId: iemAudiolinkId,
			} as Partial<MobileDevice>)
			this.instance.log('debug', `Copied IEM Mix from ${sourceMtUid} to ${targetMtUid}`)
		} catch (error) {
			this.instance.log('warn', `Copy IEM Mix: Failed to assign Audio Link: ${error}`)
		}
	}
}
