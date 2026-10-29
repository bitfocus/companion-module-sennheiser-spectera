import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InputSource, RfState, RfStateStartup, BandwidthMode, TxPower } from '../../src/types.js'
import { makeAudioOutput, makeSkmDevice } from '../fixtures/devices.js'
import { makeApi } from '../helpers/mock-api.js'

const rebuildMocks = vi.hoisted(() => ({
	variables: vi.fn(),
	variableValues: vi.fn(),
	presets: vi.fn(),
	feedbacks: vi.fn(),
	actions: vi.fn(),
}))

vi.mock('../../src/variables.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../src/variables.js')>()),
	UpdateVariableDefinitions: rebuildMocks.variables,
	UpdateVariableValues: rebuildMocks.variableValues,
}))

vi.mock('../../src/presets.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../src/presets.js')>()),
	UpdatePresets: rebuildMocks.presets,
}))

vi.mock('../../src/feedbacks.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../src/feedbacks.js')>()),
	UpdateFeedbacks: rebuildMocks.feedbacks,
}))

vi.mock('../../src/actions.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../src/actions.js')>()),
	UpdateActions: rebuildMocks.actions,
}))

interface SseTestApi {
	handleSSEEvent(event: string): void
	processStream(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void>
	startHeartbeat(): void
	subscribeStartTime: number
}

function asSseTestApi(api: object): SseTestApi {
	return api as SseTestApi
}

function event(data: Record<string, unknown>, type = 'message'): string {
	return `event: ${type}\ndata: ${JSON.stringify(data)}`
}

describe('SSE event processing', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
	})

	it('captures the subscription session and emits the subscribed event', () => {
		const { api, instance } = makeApi()
		const subscribed = vi.fn()
		api.on('subscribed', subscribed)

		asSseTestApi(api).handleSSEEvent(event({ sessionUUID: 'session-123' }, 'open'))

		expect(subscribed).toHaveBeenCalledWith('session-123')
		expect(instance.log).toHaveBeenCalledWith('debug', 'Subscription opened with sessionUUID: session-123')
	})

	it('normalizes legacy audio-input source fields and refreshes variables and feedbacks', () => {
		const { api, state, instance } = makeApi()

		asSseTestApi(api).handleSSEEvent(
			event({
				'/api/audio/inputs/0': {
					inputId: 0,
					iemAudiolinkId: -1,
					source: InputSource['MADI 1'],
					name: 'Playback',
				},
			}),
		)

		expect(state.audioInputs.get(0)).toMatchObject({ inputSource: InputSource['MADI 1'], name: 'Playback' })
		expect(instance.setVariableValues).toHaveBeenCalledWith(
			expect.objectContaining({
				audio_input_1_interface: 'MADI 1',
				audio_input_1_name: 'Playback',
				audio_input_1_iem_link_id: -1,
			}),
		)
		expect(instance.checkFeedbacks).toHaveBeenCalledWith(
			'audioInputInterface',
			'iemAudioInputLinked',
			'iemAudioInputNoLinkId',
		)
	})

	it('publishes only changed mapped RF values for an existing resource', () => {
		const { api, state, instance } = makeApi()
		state.updateRfChannel({
			rfChannelId: 0,
			txPower: TxPower['20 Mw'],
			frequency: 474000,
			bandwidthMode: BandwidthMode['8 MHz'],
			rfState: RfState.Muted,
			rfStateOnStartup: RfStateStartup.Muted,
		})

		asSseTestApi(api).handleSSEEvent(
			event({
				'/api/rf/channels/0': {
					rfChannelId: 0,
					txPower: TxPower['20 Mw'],
					frequency: 475000,
					bandwidthMode: BandwidthMode['8 MHz'],
					rfState: RfState.Active,
					rfStateOnStartup: RfStateStartup.Muted,
				},
			}),
		)

		expect(instance.setVariableValues).toHaveBeenCalledWith({
			rf_channel_1_frequency: 475,
			rf_channel_1_state: 'Active',
		})
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('rfFrequency', 'rfState')
		vi.advanceTimersByTime(250)
		expect(rebuildMocks.variables).not.toHaveBeenCalled()
	})

	it('removes deleted resources and coalesces structural rebuilds', () => {
		const { api, state } = makeApi()
		state.updateAudioLink({ audiolinkId: 10, rfChannelId: 0, modeId: 4 })
		state.updateAudioLink({ audiolinkId: 11, rfChannelId: 0, modeId: 4 })
		state.updateMobileDevice(makeSkmDevice({ mtUid: 7 }))

		asSseTestApi(api).handleSSEEvent(event({ '/api/audio/links/10': null }))
		asSseTestApi(api).handleSSEEvent(
			event({
				'/api/audio/links/11': null,
				'/api/mts/paired/all/7': null,
			}),
		)

		expect(state.audioLinks.size).toBe(0)
		expect(state.mobileDevices.size).toBe(0)
		vi.advanceTimersByTime(249)
		expect(rebuildMocks.variables).not.toHaveBeenCalled()
		vi.advanceTimersByTime(1)
		expect(rebuildMocks.variables).toHaveBeenCalledOnce()
		expect(rebuildMocks.variableValues).toHaveBeenCalledOnce()
		expect(rebuildMocks.presets).toHaveBeenCalledOnce()
		expect(rebuildMocks.feedbacks).toHaveBeenCalledOnce()
		expect(rebuildMocks.actions).toHaveBeenCalledOnce()
	})

	it('skips newly paired devices until they have a real serial number', () => {
		const { api, state, instance } = makeApi()

		asSseTestApi(api).handleSSEEvent(
			event({ '/api/mts/paired/all/9': makeSkmDevice({ mtUid: 9, serial: '0000000000' }) }),
		)

		expect(state.mobileDevices.has(9)).toBe(false)
		expect(instance.setVariableValues).not.toHaveBeenCalled()
		vi.advanceTimersByTime(250)
		expect(rebuildMocks.variables).not.toHaveBeenCalled()
	})

	it('updates output-derived variables when an output event arrives', () => {
		const { api, state, instance } = makeApi()
		state.updateMobileDevice(makeSkmDevice({ mtUid: 4, name: 'Lead Vocal', micAudiolinkId: 40 }))

		asSseTestApi(api).handleSSEEvent(
			event({ '/api/audio/outputs/1': makeAudioOutput({ outputId: 1, micAudiolinkId: 40 }) }),
		)

		expect(instance.setVariableValues).toHaveBeenCalledWith(
			expect.objectContaining({
				audio_output_2_mic_link_id: 40,
				audio_output_2_source: 'Lead Vocal',
			}),
		)
		expect(instance.checkFeedbacks).toHaveBeenCalledWith('mobileDeviceOutputLinked', 'audioOutputInterface')
	})

	it('logs malformed JSON without mutating state', () => {
		const { api, state, instance } = makeApi()

		asSseTestApi(api).handleSSEEvent('event: message\ndata: {not-json}')

		expect(state.audioInputs.size).toBe(0)
		expect(instance.log).toHaveBeenCalledWith('debug', 'Failed to parse SSE data: {not-json}')
	})

	it('reassembles events split across stream chunks', async () => {
		const { api, state } = makeApi()
		const encoder = new TextEncoder()
		const payload = `${event({
			'/api/audio/inputs/0': {
				inputId: 0,
				iemAudiolinkId: -1,
				inputSource: InputSource.Dante,
				name: 'Streamed input',
			},
		})}\n\n`
		const chunks = [payload.slice(0, 17), payload.slice(17, 45), payload.slice(45)].map((part) => encoder.encode(part))
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				for (const chunk of chunks) controller.enqueue(chunk)
				controller.close()
			},
		})

		await asSseTestApi(api).processStream(stream.getReader())

		expect(state.audioInputs.get(0)?.name).toBe('Streamed input')
	})
})

describe('SSE heartbeat', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.clearAllTimers()
		vi.useRealTimers()
	})

	function startHeartbeat() {
		const { api, instance } = makeApi()
		const reconnect = vi.spyOn(api, 'scheduleReconnect').mockImplementation(() => undefined)
		const sse = asSseTestApi(api)
		sse.subscribeStartTime = Date.now()
		sse.startHeartbeat()
		return { sse, instance, reconnect }
	}

	it('stays connected while device-time ticks keep arriving', () => {
		const { sse, reconnect } = startHeartbeat()

		for (let i = 0; i < 30; i++) {
			vi.advanceTimersByTime(1000)
			sse.handleSSEEvent(event({ '/api/device/time': { time: i, timezone: 'UTC', valid: true } }))
		}

		expect(reconnect).not.toHaveBeenCalled()
	})

	it('reconnects once the stream has been silent past the stale timeout', () => {
		const { sse, instance, reconnect } = startHeartbeat()
		sse.handleSSEEvent(event({ '/api/device/time': { time: 0, timezone: 'UTC', valid: true } }))

		vi.advanceTimersByTime(10000)
		expect(reconnect).not.toHaveBeenCalled()

		vi.advanceTimersByTime(2000)
		expect(reconnect).toHaveBeenCalledTimes(1)
		expect(instance.log).toHaveBeenCalledWith('warn', 'Connection lost to Spectera, attempting to reconnect...')
	})
})
