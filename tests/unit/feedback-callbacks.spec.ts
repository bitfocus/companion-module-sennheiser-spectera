import { describe, expect, it, vi } from 'vitest'
import { UpdateFeedbacks } from '../../src/feedbacks.js'
import { SpecteraState } from '../../src/state.js'
import {
	AntennaPortId,
	BandwidthMode,
	CableEmulation,
	CommandBehavior,
	CommandState,
	DeviceStatus,
	Interference,
	MicLineSelection,
	MicLineSelectionAuto,
	MtState,
	PsuStatus,
	RFChannels,
	RfState,
	RfStateStartup,
	TxPower,
} from '../../src/types.js'
import { makeAudioInput, makeAudioOutput, makeSekDevice, makeSkmDevice } from '../fixtures/devices.js'

function makeFeedbacks() {
	const state = new SpecteraState()
	state.updateRfChannel({
		rfChannelId: 0,
		txPower: TxPower['10 Mw'],
		frequency: 473000,
		bandwidthMode: BandwidthMode['6 MHz'],
		rfRestrictionViolation: true,
		rfState: RfState.Active,
		rfStateOnStartup: RfStateStartup.Muted,
	})
	state.updateAntenna({
		antennaPortId: AntennaPortId.A,
		state: DeviceStatus.Connected,
		warningHighTemperature: true,
		warningPacketError: true,
		interference: { severity: Interference.High, totalPower: -72 },
		temperature: 53,
		identify: true,
		ledColors: { rfActive: '#008700', rfMuted: '#FFD700' },
		bindings: [{ subAntennaId: 0, binding: RFChannels['RF Channel 1'], mismatch: false }],
	} as any)
	state.updateAudioInput(makeAudioInput({ inputId: 3, iemAudiolinkId: 20 }))
	state.updateAudioOutput(makeAudioOutput({ outputId: 4, micAudiolinkId: 10 }))
	state.updateMobileDevice(
		makeSekDevice({
			mtUid: 1,
			serial: 'SEK-001',
			state: MtState.Connected,
			identify: true,
			reverseIdentify: true,
			batteryLow: true,
			batteryFillLevel: 8,
			batteryRuntime: 20,
			frequencyRange: 'UHF',
			rfChannelId: 0,
			iemAudiolinkId: 20,
			iemAudiolinkActive: true,
			micAudiolinkId: 10,
			micAudiolinkActive: true,
			headphonePlugState: 'Plugged',
			headphoneVolume: -19.5,
			headphoneVolumeMax: 27.5,
			headphoneVolumeMin: -100,
			headphoneVolumeLimit: -18,
			headphoneBalance: 4,
			micPreampGain: 13,
			micTestToneEnabled: true,
			micTestToneLevel: -24,
			micLineSelection: MicLineSelection.Auto,
			micLineSelectionAutoValue: MicLineSelectionAuto.Mic,
			cableEmulation: CableEmulation.Long,
			commandBehavior: CommandBehavior.Latching,
			commandState: CommandState.Latched,
			connectedStateColor: '#00A100',
			interference: { severity: Interference.Low },
			dominantAntenna: AntennaPortId.A,
			micLqi: 4,
			iemLqi: 3,
			rssi: -65,
		}),
	)
	state.updateMobileDevice(makeSekDevice({ mtUid: 2, serial: 'SEK-002', iemAudiolinkId: 20 }))
	state.updateMobileDevice(
		makeSkmDevice({
			mtUid: 3,
			serial: 'SKM-003',
			micLowCutHz: 60,
			commandColors: { released: '#000000', pressed: '#00A100', latched: '#FFD700' },
		}),
	)
	state.health.psu = { psu1: PsuStatus.Connected, psu2: PsuStatus.Unconnected }
	state.basestation.state = { state: 'Normal' as any, warnings: ['temperature'] }

	const setFeedbackDefinitions = vi.fn()
	UpdateFeedbacks({
		state,
		setFeedbackDefinitions,
		pendingConfirmations: new Map(),
		confirmationKey: vi.fn(),
	} as any)
	return { state, feedbacks: setFeedbackDefinitions.mock.calls[0][0] as Record<string, any> }
}

async function result(feedbacks: Record<string, any>, id: string, options: Record<string, unknown> = {}) {
	return feedbacks[id].callback({ options })
}

describe('RF and antenna feedback callbacks', () => {
	it('matches RF channel properties and warnings', async () => {
		const { feedbacks } = makeFeedbacks()
		const cases = [
			['rfTxPower', { rfChannel: 0, rfTxPower: TxPower['10 Mw'] }],
			['rfFrequency', { rfChannel: 0, frequency: 473 }],
			['rfBandwidthMode', { rfChannel: 0, rfBandwidthMode: BandwidthMode['6 MHz'] }],
			['rfRestrictionViolation', { rfChannel: 0 }],
			['rfState', { rfChannel: 0, state: RfState.Active }],
			['rfStateOnStartup', { rfChannel: 0, stateOnStartup: RfStateStartup.Muted }],
		] as const
		for (const [id, options] of cases) await expect(result(feedbacks, id, options)).resolves.toBe(true)
	})

	it('matches antenna presence, warnings, interference, binding, color, and temperature units', async () => {
		const { feedbacks } = makeFeedbacks()
		const cases = [
			['dadState', { dad: AntennaPortId.A, state: DeviceStatus.Connected }],
			['dadAntennaPresent', { dad: AntennaPortId.A }],
			['dadWarningHighTemperature', { dad: AntennaPortId.A }],
			['dadWarningPacketError', { dad: AntennaPortId.A }],
			['dadInterference', { dad: AntennaPortId.A, severity: Interference.High }],
			['dadInterferencePower', { dad: AntennaPortId.A, interferencePower: -80 }],
			['dadIdentify', { dad: AntennaPortId.A }],
			['dadConnectedStateColor', { dad: AntennaPortId.A, rfActive: '#008700', rfMuted: '#FFD700' }],
			['dadBindings', { dad: AntennaPortId.A, bindings: RFChannels['RF Channel 1'] }],
			['dadTemperature', { dad: AntennaPortId.A, temperatureUnit: 'celsius', temperature: 50 }],
			['dadTemperature', { dad: AntennaPortId.A, temperatureUnit: 'fahrenheit', temperature: 120 }],
		] as const
		for (const [id, options] of cases) await expect(result(feedbacks, id, options)).resolves.toBe(true)
	})
})

describe('mobile-device feedback callbacks', () => {
	it('matches connectivity, health, radio, and route state', async () => {
		const { feedbacks } = makeFeedbacks()
		const serial = 'SEK-001'
		const cases = [
			['mobileDeviceIdentify', { serial }],
			['mobileDeviceReverseIdentify', { serial }],
			['mobileDeviceConnected', { serial }],
			['mobileDeviceState', { serial, state: MtState.Connected }],
			['mobileDeviceBatteryLow', { serial }],
			['mobileDeviceBatteryLevel', { serial, threshold: 10 }],
			['mobileDeviceBatteryRuntime', { serial, threshold: 30 }],
			['mobileDeviceInterference', { serial, severity: Interference.Low }],
			['mobileDeviceDominantAntenna', { serial, antenna: AntennaPortId.A }],
			['mobileDeviceFrequencyRange', { serial, range: 'UHF' }],
			['mobileDeviceRfChannelId', { serial, rfChannelId: 0 }],
			['mobileDeviceMicAudiolinkActive', { serial }],
			['iemAudioLinkActive', { serial }],
			['iemAudioInputLinked', { serial, inputId: 3 }],
			['mobileDeviceOutputLinked', { serial, outputId: 4 }],
			['mobileDeviceMicLqi', { serial, micLqiThreshold: 4 }],
			['mobileDeviceIemLqi', { serial, iemLqiThreshold: 3 }],
			['mobileDeviceRSSI', { serial, rssiThreshold: -70 }],
		] as const
		for (const [id, options] of cases) await expect(result(feedbacks, id, options)).resolves.toBe(true)
	})

	it('matches SEK settings and returns the current LED color', async () => {
		const { feedbacks } = makeFeedbacks()
		const serial = 'SEK-001'
		const cases = [
			['mobileDeviceHeadphonePlugState', { serial }],
			['mobileDeviceHeadphoneVolume', { serial, volume: -19.5 }],
			['mobileDeviceHeadphoneBalance', { serial, balance: 4 }],
			['mobileDeviceHeadphoneVolumeLimit', { serial, limit: -18 }],
			['mobileDeviceHeadphoneVolumeMax', { serial, max: 27.5 }],
			['mobileDeviceHeadphoneVolumeMin', { serial, min: -100 }],
			['mobileDeviceMicPreampGain', { serial, gain: 13 }],
			['mobileDeviceMicTestToneEnabled', { serial }],
			['mobileDeviceMicTestToneLevel', { serial, level: -24 }],
			['mobileDeviceMicLineSelection', { serial, selection: MicLineSelection.Auto }],
			['mobileDeviceMicLineSelectionAutoValue', { serial, autoValue: MicLineSelectionAuto.Mic }],
			['mobileDeviceCableEmulation', { serial, emulation: CableEmulation.Long }],
			['mobileDeviceCommandBehavior', { serial, commandBehavior: CommandBehavior.Latching }],
			['mobileDeviceCommandState', { serial, commandState: CommandState.Latched }],
			['mobileDeviceConnectedStateColor', { serial, connectedStateColor: '#00a100' }],
			['iemAudioLinkMatch', { serial1: serial, serial2: 'SEK-002' }],
		] as const
		for (const [id, options] of cases) await expect(result(feedbacks, id, options)).resolves.toBe(true)
		await expect(result(feedbacks, 'mobileDeviceConnectedStateColorCurrent', { serial })).resolves.toEqual({
			bgcolor: 0x00a100,
		})
	})

	it('matches SKM command colors per state and never matches a SEK', async () => {
		const { feedbacks } = makeFeedbacks()
		const match = async (serial: string, commandState: string, color: string) =>
			result(feedbacks, 'mobileDeviceCommandColor', { serial, commandState, color })

		await expect(match('SKM-003', 'latched', '#ffd700')).resolves.toBe(true)
		await expect(match('SKM-003', 'pressed', '#ffd700')).resolves.toBe(false)
		await expect(match('SKM-003', 'unlatched', '#000000')).resolves.toBe(false)
		await expect(match('SEK-001', 'released', '#000000')).resolves.toBe(false)
	})

	it('handles SKM low-cut aliases and rejects SEK-only feedbacks for an SKM', async () => {
		const { feedbacks } = makeFeedbacks()
		await expect(result(feedbacks, 'mobileDeviceMicLowCutHz', { serial: 'SKM-003', frequency: 20 })).resolves.toBe(true)
		await expect(result(feedbacks, 'mobileDeviceHeadphoneVolume', { serial: 'SKM-003', volume: 0 })).resolves.toBe(
			false,
		)
	})
})

describe('base-station feedback callbacks', () => {
	it('matches state, warnings, and connected PSU status', async () => {
		const { feedbacks } = makeFeedbacks()
		await expect(result(feedbacks, 'baseStationState', { state: 'Normal' })).resolves.toBe(true)
		await expect(result(feedbacks, 'baseStationWarnings')).resolves.toBe(true)
		await expect(result(feedbacks, 'baseStationPsu', { psu: 'psu1' })).resolves.toBe(true)
		await expect(result(feedbacks, 'baseStationPsu', { psu: 'psu2' })).resolves.toBe(false)
	})
})

describe('audio link ID zero feedback regressions', () => {
	it('recognizes link 0 as linked, active, and shared', async () => {
		const { state, feedbacks } = makeFeedbacks()
		state.updateAudioInput(makeAudioInput({ inputId: 0, iemAudiolinkId: 0 }))
		state.updateAudioOutput(makeAudioOutput({ outputId: 0, micAudiolinkId: 0 }))
		state.updateMobileDevice(
			makeSekDevice({
				mtUid: 20,
				serial: 'ZERO-1',
				iemAudiolinkId: 0,
				micAudiolinkId: 0,
				iemAudiolinkActive: true,
				micAudiolinkActive: true,
			}),
		)
		state.updateMobileDevice(makeSekDevice({ mtUid: 21, serial: 'ZERO-2', iemAudiolinkId: 0 }))

		await expect(result(feedbacks, 'iemAudioInputLinked', { serial: 'ZERO-1', inputId: 0 })).resolves.toBe(true)
		await expect(result(feedbacks, 'mobileDeviceOutputLinked', { serial: 'ZERO-1', outputId: 0 })).resolves.toBe(true)
		await expect(result(feedbacks, 'iemAudioLinkMatch', { serial1: 'ZERO-1', serial2: 'ZERO-2' })).resolves.toBe(true)
		await expect(result(feedbacks, 'iemAudioInputNoLinkId', { serial: 'ZERO-1' })).resolves.toBe(false)
	})
})
