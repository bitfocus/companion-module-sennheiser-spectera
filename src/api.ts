import EventEmitter from 'events'
import type { SpecteraInstance } from './main.js'
import type {
	AudioInput,
	AudioOutput,
	RfChannel,
	MobileDevice,
	Antenna,
	PsuState,
	TempState,
	FanState,
	DeviceIdentity,
	DeviceState,
	DeviceSite,
} from './types.js'
import type { SpecteraState } from './state.js'
import { Agent, Dispatcher } from 'undici'
import { UpdateVariableDefinitions, UpdateVariableValues } from './variables.js'

export class SpecteraApi extends EventEmitter {
	private readonly host: string
	private readonly password: string
	private readonly instance: SpecteraInstance
	private readonly state: SpecteraState
	private abortController: AbortController | null = null
	private sessionUUID: string | null = null
	private readonly dispatcher: Dispatcher

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
			await this.getDeviceState()
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
			const [inputs, outputs, channels, antennas, devices, psu, temp, fan1, fan2, fan3, identity, state, site] =
				await Promise.all([
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
					this.getDeviceIdentity(),
					this.getDeviceState(),
					this.getDeviceSite(),
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
			this.state.updateDeviceIdentity(identity)
			this.state.updateDeviceState(state)
			this.state.updateDeviceSite(site)

			UpdateVariableDefinitions(this.instance)
			UpdateVariableValues(this.instance)
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

	private processInternalUpdate(_eventType: string, data: any): void {
		let structureChanged = false
		const keys = Object.keys(data)

		for (const key of keys) {
			const value = data[key]

			if (key.startsWith('/api/audio/inputs/')) {
				this.state.updateAudioInput(value)
				structureChanged = true
			} else if (key.startsWith('/api/audio/outputs/')) {
				this.state.updateAudioOutput(value)
				structureChanged = true
			} else if (key.startsWith('/api/rf/channels/')) {
				this.state.updateRfChannel(value)
				structureChanged = true
			} else if (key.startsWith('/api/rf/antennas/')) {
				this.state.updateAntenna(value)
				structureChanged = true
			} else if (key.startsWith('/api/mts/paired/all/')) {
				this.state.updateMobileDevice(value)
				structureChanged = true
			} else if (key === '/api/health/psu') {
				this.state.updatePsuState(value)
			} else if (key === '/api/health/tempstateoverall') {
				this.state.updateTempState(value)
			} else if (key.startsWith('/api/health/fan/')) {
				// Extract fan ID from path: /api/health/fan/{fanId}/errorstate
				const match = key.match(/\/api\/health\/fan\/(.+)\/errorstate/)
				if (match && match[1]) {
					const fanId = match[1]
					this.state.updateFanState(fanId, value)
				}
			} else if (key === '/api/device/identity') {
				this.state.updateDeviceIdentity(value)
			} else if (key === '/api/device/state') {
				this.state.updateDeviceState(value)
			} else if (key === '/api/device/site') {
				this.state.updateDeviceSite(value)
			}
		}

		if (structureChanged) {
			this.instance.log('debug', 'Structure changed, updating variable definitions')
			UpdateVariableDefinitions(this.instance)
		}
		UpdateVariableValues(this.instance)
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

	async getAudioOutputs(): Promise<AudioOutput[]> {
		return this.sendRequest<AudioOutput[]>('GET', '/audio/outputs')
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

	async getDeviceIdentity(): Promise<DeviceIdentity> {
		return this.sendRequest<DeviceIdentity>('GET', '/device/identity')
	}

	async getDeviceState(): Promise<DeviceState> {
		return this.sendRequest<DeviceState>('GET', '/device/state')
	}

	async getDeviceSite(): Promise<DeviceSite> {
		return this.sendRequest<DeviceSite>('GET', '/device/site')
	}
}
