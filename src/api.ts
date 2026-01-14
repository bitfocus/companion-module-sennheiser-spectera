import EventEmitter from 'events'
import type { SpecteraInstance } from './main.js'
import type {
	AudioInput,
	AudioOutput,
	RfChannel,
	MobileDevice,
	Antenna,
	AudioLink,
	PsuState,
	TempState,
	FanState,
	BaseStationSite,
	BaseStationState,
	BaseStationIdentity,
} from './types.js'
import type { SpecteraState } from './state.js'
import { Agent, Dispatcher } from 'undici'
import { UpdateVariableDefinitions, UpdateVariableValues } from './variables.js'
import { UpdatePresets } from './presets.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdateActions } from './actions.js'
import {
	StateMap,
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
} from './state_maps.js'

export class SpecteraApi extends EventEmitter {
	private readonly host: string
	private readonly password: string
	private readonly instance: SpecteraInstance
	private readonly state: SpecteraState
	private abortController: AbortController | null = null
	private sessionUUID: string | null = null
	private readonly dispatcher: Dispatcher
	private variableCache: Record<string, string | number | boolean | undefined> = {}

	constructor(instance: SpecteraInstance, state: SpecteraState, host: string, password: string) {
		super()
		this.instance = instance
		this.state = state
		this.host = host
		this.password = password
		this.dispatcher = new Agent({
			connect: {
				rejectUnauthorized: false,
			},
		})
	}

	private getAuthHeader(): string {
		const credentials = `controlSennheiser:${this.password}`
		return `Basic ${Buffer.from(credentials).toString('base64')}`
	}

	async sendRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
		const url = `https://${this.host}:443/api${path}`
		const options: RequestInit = {
			method,
			headers: {
				Authorization: this.getAuthHeader(),
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		}

		if (body) {
			options.body = JSON.stringify(body)
		}

		try {
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
				// If JSON parsing fails but status was OK, return empty object
				return {} as T
			}
		} catch (error) {
			this.instance.log(
				'error',
				`API Request failed for ${method} ${path}: ${error instanceof Error ? error.message : String(error)}`,
			)
			throw error
		}
	}

	async performLogin(): Promise<void> {
		try {
			await this.getBaseStationState()
		} catch (error) {
			this.instance.log('error', `Login failed: ${error instanceof Error ? error.message : String(error)}`)
			throw error
		}
	}

	async startMonitoring(): Promise<void> {
		this.on('subscribed', () => {
			this.setSubscriptionPaths([
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
			]).catch((err) => {
				this.instance.log('error', `Failed to set subscription paths: ${err.message}`)
			})
		})

		// Start subscription
		await this.subscribe()

		// Wait for sessionUUID to be available (from 'open' event)
		// Usually subscribe() resolves when the request is sent, but handleSSEEvent sets the UUID
		// To be safe, we can fetch initial data immediately
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

			UpdateVariableDefinitions(this.instance)
			UpdateVariableValues(this.instance)
			UpdatePresets(this.instance)
			UpdateFeedbacks(this.instance)
			UpdateActions(this.instance)
		} catch (error) {
			this.instance.log('error', `Initial data fetch failed: ${error instanceof Error ? error.message : String(error)}`)
			// We don't throw here to allow the subscription to keep running if the fetch fails
		}
	}

	async disconnect(): Promise<void> {
		if (this.sessionUUID) {
			try {
				await this.sendRequest('DELETE', `/ssc/state/subscriptions/${this.sessionUUID}`)
			} catch (error) {
				this.instance.log(
					'debug',
					`Failed to delete subscription on disconnect: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
			this.sessionUUID = null
		}

		if (this.abortController) {
			this.abortController.abort()
			this.abortController = null
		}

		this.removeAllListeners()
	}

	private async subscribe(): Promise<void> {
		if (this.abortController) {
			this.abortController.abort()
		}
		this.abortController = new AbortController()

		const url = `https://${this.host}:443/api/ssc/state/subscriptions`
		const options: RequestInit = {
			method: 'GET',
			headers: {
				Authorization: this.getAuthHeader(),
				Accept: 'text/event-stream',
			},
			signal: this.abortController.signal,
		}

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

			this.processStream(reader).catch((err) => {
				if (err.name !== 'AbortError') {
					this.instance.log('error', `SSE Stream error: ${err.message}`)
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
		changedVariables: Record<string, any>,
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
				if (entry.feedback) feedbacksToCheck.add(entry.feedback)

				if (entry.variable && entry.valueFn) {
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
				structureChanged = !oldState
			} else if (key.startsWith('/api/audio/outputs/')) {
				const oldState = this.state.audioOutputs.get(value.outputId)
				this.state.updateAudioOutput(value)
				this.handleStateUpdate(
					`audio_output_${value.outputId}_`,
					oldState,
					value,
					AudioOutputStateMap,
					changedVariables,
					feedbacksToCheck,
				)
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
				const oldState = this.state.antennas.get(value.antennaPortId)
				this.state.updateAntenna(value) // Note: value needs to be compatible with Antenna interface
				// The API returns the object with antennaPortId.
				// sanitizeName is needed for prefix.
				const port = value.antennaPortId.replace(/[^a-zA-Z0-9_-]/g, '_')
				this.handleStateUpdate(`dad_${port}_`, oldState, value, AntennaStateMap, changedVariables, feedbacksToCheck)
				structureChanged = !oldState
			} else if (key.startsWith('/api/mts/paired/all/')) {
				const oldState = this.state.mobileDevices.get(value.mtUid)
				this.state.updateMobileDevice(value)
				const name = value.name.replace(/[^a-zA-Z0-9_-]/g, '_')
				const type = value.type
				const serial = value.serial
				const prefix = `${type}_${name}_${serial}_`
				this.handleStateUpdate(prefix, oldState as any, value, MobileDeviceStateMap, changedVariables, feedbacksToCheck)
				structureChanged = !oldState || oldState.name !== value.name
			} else if (key === '/api/health/psu') {
				const oldState = { ...this.state.health.psu } // Clone old state
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
			}
		}

		if (structureChanged) {
			this.instance.log('debug', 'Structure changed, updating variable definitions')
			UpdateVariableDefinitions(this.instance)
			UpdatePresets(this.instance)
			UpdateFeedbacks(this.instance)
			UpdateActions(this.instance)
			UpdateVariableValues(this.instance)
		}

		if (Object.keys(changedVariables).length > 0) {
			this.instance.setVariableValues(changedVariables)
			console.log('Changed variables:', changedVariables)
		}

		if (feedbacksToCheck.size > 0) {
			this.instance.checkFeedbacks(...Array.from(feedbacksToCheck))
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
}
