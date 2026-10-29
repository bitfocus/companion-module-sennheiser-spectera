import { describe, expect, it, vi } from 'vitest'
import { UpdateActions } from '../../src/actions.js'
import { UpdateFeedbacks } from '../../src/feedbacks.js'
import { UpdateCompositeElements } from '../../src/graphics.js'
import { SpecteraState } from '../../src/state.js'
import { InputSource, InterfaceInputStatus, RfState } from '../../src/types.js'
import { makeAudioInput, makeSekDevice, makeSkmDevice } from '../fixtures/devices.js'

function makeInstance() {
	const state = new SpecteraState()
	const instance = {
		state,
		api: {
			setRfChannel: vi.fn().mockResolvedValue(undefined),
			setAudioInput: vi.fn().mockResolvedValue(undefined),
			setMobileDevice: vi.fn().mockResolvedValue(undefined),
		},
		confirmationKey: vi.fn((id: string) => `${id}:key`),
		confirmAction: vi.fn(() => true),
		pendingConfirmations: new Map<string, NodeJS.Timeout>(),
		setActionDefinitions: vi.fn(),
		setFeedbackDefinitions: vi.fn(),
		setCompositeElementDefinitions: vi.fn(),
		checkFeedbacks: vi.fn(),
		log: vi.fn(),
	}
	return instance
}

function registeredDefinitions(setter: ReturnType<typeof vi.fn>): Record<string, any> {
	return setter.mock.calls[0][0]
}

describe('action definitions', () => {
	it('registers the complete action surface and translates RF frequency to kHz', async () => {
		const instance = makeInstance()
		UpdateActions(instance as any)
		const actions = registeredDefinitions(instance.setActionDefinitions)

		expect(Object.keys(actions)).toHaveLength(33)
		await actions.rfFrequency.callback({
			options: { rfChannel: 1, frequency: 475, requireConfirmation: false },
		})
		expect(instance.api.setRfChannel).toHaveBeenCalledWith(1, { rfChannelId: 1, frequency: 475000 })
	})

	it('snaps RF frequency to whole MHz', async () => {
		const instance = makeInstance()
		UpdateActions(instance as any)
		const actions = registeredDefinitions(instance.setActionDefinitions)

		await actions.rfFrequency.callback({ options: { rfChannel: 1, frequency: 520.5, requireConfirmation: false } })

		expect(instance.api.setRfChannel).toHaveBeenCalledWith(1, { rfChannelId: 1, frequency: 521000 })
	})

	it('defines numeric options as clamped number fields', () => {
		const instance = makeInstance()
		UpdateActions(instance as any)
		UpdateFeedbacks(instance as any)
		const actions = registeredDefinitions(instance.setActionDefinitions)
		const feedbacks = registeredDefinitions(instance.setFeedbackDefinitions)
		const field = (def: { options: { id: string }[] }, id: string) => def.options.find((o) => o.id === id)

		expect(field(actions.mobileDeviceHeadphoneVolume, 'volume')).toMatchObject({
			type: 'number',
			default: -20,
			min: -100,
			max: 27.5,
			step: 0.5,
			clampValues: true,
		})
		expect(field(actions.rfFrequency, 'frequency')).toMatchObject({ type: 'number', default: 474, asInteger: true })
		expect(field(feedbacks.audioLevelThreshold, 'channel')).toMatchObject({ type: 'number', min: 1, max: 32 })
	})

	it('does not execute a confirmable action until confirmation succeeds', async () => {
		const instance = makeInstance()
		instance.confirmAction.mockReturnValue(false)
		UpdateActions(instance as any)
		const actions = registeredDefinitions(instance.setActionDefinitions)

		await actions.setRfChannelState.callback({
			options: { rfChannel: 0, state: RfState.Active, requireConfirmation: true },
		})
		expect(instance.confirmationKey).toHaveBeenCalledWith('setRfChannelState', {
			rfChannel: 0,
			state: RfState.Active,
		})
		expect(instance.api.setRfChannel).not.toHaveBeenCalled()
	})

	it('toggles an audio input away from its current interface', async () => {
		const instance = makeInstance()
		instance.state.updateAudioInput(makeAudioInput({ inputId: 2, inputSource: InputSource.Dante, iemAudiolinkId: 20 }))
		UpdateActions(instance as any)
		const actions = registeredDefinitions(instance.setActionDefinitions)

		await actions.setAudioInputInterface.callback({
			options: {
				inputId: [2],
				interface: InputSource.Dante,
				mode: 'Toggle',
				toggleInterface: InputSource['MADI 1'],
				requireConfirmation: false,
			},
		})
		expect(instance.api.setAudioInput).toHaveBeenCalledWith(2, { inputSource: InputSource['MADI 1'] })
	})
})

describe('mobile device actions', () => {
	function setup() {
		const instance = makeInstance()
		instance.state.updateMobileDevice(
			makeSekDevice({ headphoneVolume: 10, headphoneVolumeMax: 12, headphoneBalance: 95, micPreampGain: 40 }),
		)
		instance.state.updateMobileDevice(makeSkmDevice({ micPreampGain: -8 }))
		UpdateActions(instance as any)
		const actions = registeredDefinitions(instance.setActionDefinitions)
		return { instance, actions, setMobileDevice: instance.api.setMobileDevice }
	}

	it('skips the action when the device is unknown or the API is not connected', async () => {
		const { instance, actions, setMobileDevice } = setup()

		await actions.mobileDeviceIdentify.callback({ options: { serial: 'MISSING', identify: 'true' } })
		;(instance as { api?: unknown }).api = undefined
		await actions.mobileDeviceIdentify.callback({ options: { serial: 'SEK-001', identify: 'true' } })

		expect(setMobileDevice).not.toHaveBeenCalled()
	})

	it('adjusts SEK headphone volume and balance within their limits', async () => {
		const { actions, setMobileDevice } = setup()

		await actions.mobileDeviceHeadphoneVolume.callback({
			options: { serial: 'SEK-001', action: 'adjust', adjustment: 5 },
		})
		await actions.mobileDeviceHeadphoneBalance.callback({
			options: { serial: 'SEK-001', action: 'adjust', adjustment: 10 },
		})

		expect(setMobileDevice).toHaveBeenCalledWith(1, { headphoneVolume: 12 })
		expect(setMobileDevice).toHaveBeenCalledWith(1, { headphoneBalance: 100 })
	})

	it('ignores headphone actions for SKM devices', async () => {
		const { actions, setMobileDevice } = setup()

		await actions.mobileDeviceHeadphoneVolume.callback({ options: { serial: 'SKM-001', action: 'set', volume: 0 } })
		await actions.mobileDeviceHeadphoneBalance.callback({ options: { serial: 'SKM-001', action: 'set', balance: 0 } })

		expect(setMobileDevice).not.toHaveBeenCalled()
	})

	it('clamps mic preamp gain to the per-type range', async () => {
		const { actions, setMobileDevice } = setup()

		await actions.mobileDeviceMicPreampGain.callback({
			options: { serial: 'SEK-001', action: 'adjust', adjustment: 6 },
		})
		await actions.mobileDeviceMicPreampGain.callback({ options: { serial: 'SKM-001', action: 'set', gain: -20 } })

		expect(setMobileDevice).toHaveBeenCalledWith(1, { micPreampGain: 42 })
		expect(setMobileDevice).toHaveBeenCalledWith(2, { micPreampGain: -10 })
	})

	it('snaps volume, balance, gain and test tone to the steps the base station accepts', async () => {
		const { actions, setMobileDevice } = setup()

		await actions.mobileDeviceHeadphoneVolume.callback({
			options: { serial: 'SEK-001', action: 'set', volume: -20.3 },
		})
		await actions.mobileDeviceHeadphoneBalance.callback({
			options: { serial: 'SEK-001', action: 'set', balance: 10.4 },
		})
		await actions.mobileDeviceMicPreampGain.callback({
			options: { serial: 'SKM-001', action: 'adjust', adjustment: 0.6 },
		})
		await actions.mobileDeviceMicTestTone.callback({ options: { serial: 'SKM-001', enable: true, level: -75 } })

		expect(setMobileDevice).toHaveBeenCalledWith(1, { headphoneVolume: -20.5 })
		expect(setMobileDevice).toHaveBeenCalledWith(1, { headphoneBalance: 10 })
		expect(setMobileDevice).toHaveBeenCalledWith(2, { micPreampGain: -7 })
		expect(setMobileDevice).toHaveBeenCalledWith(2, { micTestToneEnabled: true, micTestToneLevel: -60 })
	})

	it('sets all four SKM command colors and ignores SEK devices', async () => {
		const { actions, setMobileDevice } = setup()
		const options = { released: '#000000', pressed: '#00a100', unlatched: 'rgb(255,0,0)', latched: '#ffd700' }

		await actions.mobileDeviceCommandColors.callback({ options: { serial: 'SEK-001', ...options } })
		await actions.mobileDeviceCommandColors.callback({ options: { serial: 'SKM-001', ...options } })

		expect(setMobileDevice).toHaveBeenCalledTimes(1)
		expect(setMobileDevice).toHaveBeenCalledWith(2, {
			commandColors: { released: '#000000', pressed: '#00A100', unlatched: '#FF0000', latched: '#FFD700' },
		})
	})
})

describe('feedback definitions', () => {
	it('registers feedbacks and evaluates live-style metering data', async () => {
		const instance = makeInstance()
		instance.state.audioLevels = { updateCounter: 4, aoIpIn: { rms: [-30, -12], peak: [-25, -8] } }
		UpdateFeedbacks(instance as any)
		const feedbacks = registeredDefinitions(instance.setFeedbackDefinitions)

		expect(Object.keys(feedbacks).length).toBeGreaterThan(50)
		await expect(
			feedbacks.audioLevelThreshold.callback({ options: { interface: 'danteIn', channel: '2', threshold: '-10' } }),
		).resolves.toBe(true)
		await expect(
			feedbacks.audioLevelThreshold.callback({ options: { interface: 'danteIn', channel: '1', threshold: '-10' } }),
		).resolves.toBe(false)
	})

	it('maps each threshold interface option to its metering field', async () => {
		const instance = makeInstance()
		instance.state.audioLevels = {
			updateCounter: 1,
			aoIpOut: { rms: [-12], peak: [-5] },
			madi2In: { rms: [-12], peak: [-5] },
		}
		UpdateFeedbacks(instance as any)
		const feedbacks = registeredDefinitions(instance.setFeedbackDefinitions)
		const check = (iface: string) =>
			feedbacks.audioLevelThreshold.callback({ options: { interface: iface, channel: '1', threshold: '-10' } })

		await expect(check('danteOut')).resolves.toBe(true)
		await expect(check('madi2In')).resolves.toBe(true)
		await expect(check('madi1In')).resolves.toBe(false)
		await expect(check('unknown')).resolves.toBe(false)
	})

	it('reads nested interface status and matches a pending confirmation key', async () => {
		const instance = makeInstance()
		instance.state.madi1 = {
			inputStatus: { status: InterfaceInputStatus.Locked },
			outputStatus: { clockSourceStatus: InterfaceInputStatus.Unlocked },
		} as any
		instance.state.updateMobileDevice(makeSekDevice())
		instance.pendingConfirmations.set(
			'rfFrequency:key',
			setTimeout(() => undefined, 1000),
		)
		UpdateFeedbacks(instance as any)
		const feedbacks = registeredDefinitions(instance.setFeedbackDefinitions)

		await expect(
			feedbacks.audioInterfaceStatus.callback({
				options: { interface: 'madi1In', status: InterfaceInputStatus.Locked },
			}),
		).resolves.toBe(true)
		await expect(
			feedbacks.confirmPending.callback({
				options: { actionType: 'rfFrequency', rfFrequency_rfChannel: 0, rfFrequency_frequency: 474 },
			}),
		).resolves.toBe(true)
	})
})

describe('composite element definitions', () => {
	it('registers signal, audio, and RSSI meters with their boundary expressions', () => {
		const instance = makeInstance()
		UpdateCompositeElements(instance as any)
		const elements = registeredDefinitions(instance.setCompositeElementDefinitions)

		expect(Object.keys(elements)).toEqual(['signalBars', 'audioMeter', 'rssiMeter'])
		expect(elements.signalBars.elements).toHaveLength(8)
		expect(elements.audioMeter.elements).toHaveLength(4)
		expect(elements.audioMeter.elements[0].value.value).toContain('max(0, min(100')
		expect(elements.audioMeter.elements[2].enabled.value).toContain('stereo')
		expect(elements.rssiMeter.elements[0]).toMatchObject({ min: -90, max: -30, origin: -90 })
	})
})
