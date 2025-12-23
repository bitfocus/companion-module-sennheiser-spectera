import EventEmitter from 'events'
import type { SpecteraInstance } from './main.js'
import type { AudioInput, AudioOutput, RfChannel, MobileDevice, Antenna } from './types.js'
import type { SpecteraState } from './state.js'

export class SpecteraApi extends EventEmitter {
	private readonly host: string
	private readonly password: string
	private readonly instance: SpecteraInstance
	private readonly state: SpecteraState
	private abortController: AbortController | null = null
	private sessionUUID: string | null = null

	constructor(instance: SpecteraInstance, state: SpecteraState, host: string, password: string) {
		super()
		this.instance = instance
		this.state = state
		this.host = host
		this.password = password
	}

	private get authHeader(): string {
		const credentials = `controlSennheiser:${this.password}`
		return `Basic ${Buffer.from(credentials).toString('base64')}`
	}

	async sendRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
		const url = `https://${this.host}${path}`
		const options: RequestInit = {
			method,
			headers: {
				Authorization: this.authHeader,
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		}

		if (body) {
			options.body = JSON.stringify(body)
		}

		try {
			const response = await fetch(url, options)

			if (!response.ok) {
				const errorText = await response.text().catch(() => 'Unknown error')
				this.instance.log('error', `HTTP ${response.status}: ${errorText}`)
			}

			if (response.status === 204) {
				return {} as T
			}

			return (await response.json()) as T
		} catch (error) {
			this.instance.log('error', `API Request failed: ${error instanceof Error ? error.message : String(error)}`)
			throw error
		}
	}

	async performLogin(): Promise<void> {
		this.on('subscribed', () => {
			this.setSubscriptionPaths(['/audio', '/rf', '/antennas', '/mobile-devices']).catch((err) => {
				this.instance.log('error', `Failed to set subscription paths: ${err.message}`)
			})
		})

		// Start subscription
		await this.subscribe()

		// Wait for sessionUUID to be available (from 'open' event)
		// Usually subscribe() resolves when the request is sent, but handleSSEEvent sets the UUID
		// To be safe, we can fetch initial data immediately
		try {
			const [inputs, outputs, channels, antennas, devices] = await Promise.all([
				this.getAudioInputs(),
				this.getAudioOutputs(),
				this.getRfChannels(),
				this.getAntennas(),
				this.getMobileDevices(),
			])

			inputs.forEach((i) => this.state.updateAudioInput(i))
			outputs.forEach((o) => this.state.updateAudioOutput(o))
			channels.forEach((c) => this.state.updateRfChannel(c))
			antennas.forEach((a) => this.state.updateAntenna(a))
			devices.forEach((d) => this.state.updateMobileDevice(d))
		} catch (error) {
			this.instance.log('error', `Initial data fetch failed: ${error instanceof Error ? error.message : String(error)}`)
			// We don't throw here to allow the subscription to keep running if the fetch fails
		}
	}

	async disconnect(): Promise<void> {
		if (this.sessionUUID) {
			try {
				await this.sendRequest('DELETE', `/api/ssc/state/subscriptions/${this.sessionUUID}`)
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

		const url = `https://${this.host}/api/ssc/state/subscriptions`
		const options: RequestInit = {
			method: 'GET',
			headers: {
				Authorization: this.authHeader,
				Accept: 'text/event-stream',
			},
			signal: this.abortController.signal,
		}

		try {
			const response = await fetch(url, options)
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

	private processInternalUpdate(eventType: string, data: any): void {
		// Implementation of path-based updates moved from main.ts
		if (eventType.startsWith('/audio/inputs/')) {
			this.state.updateAudioInput(data)
		} else if (eventType.startsWith('/audio/outputs/')) {
			this.state.updateAudioOutput(data)
		} else if (eventType.startsWith('/rf/channels/')) {
			this.state.updateRfChannel(data)
		} else if (eventType.startsWith('/antennas/')) {
			this.state.updateAntenna(data)
		} else if (eventType.startsWith('/mobile-devices/')) {
			this.state.updateMobileDevice(data)
		}
	}

	async setSubscriptionPaths(paths: string[]): Promise<void> {
		if (!this.sessionUUID) {
			this.instance.log('debug', 'No active session, skipping subscription paths update')
			return
		}
		await this.sendRequest('PUT', `/api/ssc/state/subscriptions/${this.sessionUUID}`, paths)
	}

	async getAudioInputs(): Promise<AudioInput[]> {
		return this.sendRequest<AudioInput[]>('GET', '/api/audio/inputs')
	}

	async getAudioOutputs(): Promise<AudioOutput[]> {
		return this.sendRequest<AudioOutput[]>('GET', '/api/audio/outputs')
	}

	async getRfChannels(): Promise<RfChannel[]> {
		return this.sendRequest<RfChannel[]>('GET', '/api/rf/channels')
	}

	async getAntennas(): Promise<Antenna[]> {
		return this.sendRequest<Antenna[]>('GET', '/api/antennas')
	}

	async getMobileDevices(): Promise<MobileDevice[]> {
		return this.sendRequest<MobileDevice[]>('GET', '/api/mobile-devices')
	}
}
