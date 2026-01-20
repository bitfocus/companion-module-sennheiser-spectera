import type { SpecteraInstance } from './main.js'
import { type CompanionFeedbackDefinitions } from '@companion-module/base'
import {
	AntennaPortId,
	BandwidthMode,
	DeviceStatus,
	LedBrightness,
	BaseStationStatus,
	CableEmulation,
	RFChannels,
	RfState,
	RfStateStartup,
	TxPower,
	PsuState,
	PsuStatus,
	MtState,
	MtType,
	Interference,
	MicLineSelection,
	MicLineSelectionAuto,
	MicLowCutHzSEK,
	InterfaceInputStatus,
} from './types.js'
import { getChoicesFromEnum, getMobileDeviceChoices, getAudioLinkChoices } from './utils.js'
import { Color } from './utils.js'

export function UpdateFeedbacks(self: SpecteraInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	feedbacks['rfTxPower'] = {
		type: 'boolean',
		name: 'RF - Tx Power',
		description: 'RF - Tx Power',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: [
					{ label: 'RF Channel 1', id: 0 },
					{ label: 'RF Channel 2', id: 1 },
				],
				default: 0,
				id: 'rfChannel',
			},
			{
				type: 'dropdown',
				label: 'Tx Power',
				choices: getChoicesFromEnum(TxPower),
				default: TxPower['10 Mw'],
				id: 'rfTxPower',
			},
		],
		callback: async (feedback) => {
			const rfTxPower = self.state.rfChannels.get(feedback.options.rfChannel as number)?.txPower
			return rfTxPower === feedback.options.rfTxPower
		},
	}
	feedbacks['rfFrequency'] = {
		type: 'boolean',
		name: 'RF - Frequency',
		description: 'RF - Frequency',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: [
					{ label: 'RF Channel 1', id: 0 },
					{ label: 'RF Channel 2', id: 1 },
				],
				default: 0,
				id: 'rfChannel',
			},
			{
				type: 'textinput',
				label: 'Frequency (MHz)',
				default: '446',
				id: 'frequency',
			},
		],
		callback: async (feedback) => {
			const rfFrequency = self.state.rfChannels.get(feedback.options.rfChannel as number)?.frequency
			return rfFrequency === (feedback.options.frequency as number) * 1000
		},
	}
	feedbacks['rfBandwidthMode'] = {
		type: 'boolean',
		name: 'RF - Bandwidth Mode',
		description: 'RF - Bandwidth Mode',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: [
					{ label: 'RF Channel 1', id: 0 },
					{ label: 'RF Channel 2', id: 1 },
				],
				default: 0,
				id: 'rfChannel',
			},
			{
				type: 'dropdown',
				label: 'Bandwidth Mode',
				choices: getChoicesFromEnum(BandwidthMode),
				default: BandwidthMode['6 MHz'],
				id: 'rfBandwidthMode',
			},
		],
		callback: async (feedback) => {
			const rfBandwidthMode = self.state.rfChannels.get(feedback.options.rfChannel as number)?.bandwidthMode
			return rfBandwidthMode === feedback.options.rfBandwidthMode
		},
	}
	feedbacks['rfRestrictionViolation'] = {
		type: 'boolean',
		name: 'RF - Restriction Violation',
		description: 'RF - Restriction Violation',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: [
					{ label: 'RF Channel 1', id: 0 },
					{ label: 'RF Channel 2', id: 1 },
				],
				default: 0,
				id: 'rfChannel',
			},
		],
		callback: async (feedback) => {
			const rfRestrictionViolation = self.state.rfChannels.get(
				feedback.options.rfChannel as number,
			)?.rfRestrictionViolation
			return rfRestrictionViolation === true
		},
	}
	feedbacks['rfState'] = {
		type: 'boolean',
		name: 'RF - State',
		description: 'RF - State',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: [
					{ label: 'RF Channel 1', id: 0 },
					{ label: 'RF Channel 2', id: 1 },
				],
				default: 0,
				id: 'rfChannel',
			},
			{
				type: 'dropdown',
				label: 'State',
				choices: getChoicesFromEnum(RfState),
				default: RfState.Active,
				id: 'state',
			},
		],
		callback: async (feedback) => {
			const rfState = self.state.rfChannels.get(feedback.options.rfChannel as number)?.rfState
			return rfState === feedback.options.state
		},
	}
	feedbacks['rfStateOnStartup'] = {
		type: 'boolean',
		name: 'RF - State on Start Up',
		description: 'RF - State on Start Up',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: [
					{ label: 'RF Channel 1', id: 0 },
					{ label: 'RF Channel 2', id: 1 },
				],
				default: 0,
				id: 'rfChannel',
			},
			{
				type: 'dropdown',
				label: 'State on Start Up',
				choices: getChoicesFromEnum(RfStateStartup),
				default: RfStateStartup.Active,
				id: 'stateOnStartup',
			},
		],
		callback: async (feedback) => {
			const rfStateOnStartUp = self.state.rfChannels.get(feedback.options.rfChannel as number)?.rfStateOnStartup
			return rfStateOnStartUp === feedback.options.stateOnStartup
		},
	}

	//Antenna Feedbacks
	feedbacks['dadState'] = {
		type: 'boolean',
		name: 'DAD - State',
		description: 'DAD - State',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'DAD',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'dad',
			},
			{
				type: 'dropdown',
				label: 'State',
				choices: getChoicesFromEnum(DeviceStatus),
				default: DeviceStatus.Connected,
				id: 'state',
			},
		],
		callback: async (feedback) => {
			const antennaState = self.state.antennas.get(feedback.options.dad as AntennaPortId)?.state
			return antennaState === feedback.options.state
		},
	}
	feedbacks['dadWarningHighTemperature'] = {
		type: 'boolean',
		name: 'DAD - Warning High Temperature',
		description: 'DAD - Warning High Temperature',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'DAD',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'dad',
			},
		],
		callback: async (feedback) => {
			const antennaWarningHighTemperature = self.state.antennas.get(
				feedback.options.dad as AntennaPortId,
			)?.warningHighTemperature
			return antennaWarningHighTemperature === true
		},
	}
	feedbacks['dadWarningPacketError'] = {
		type: 'boolean',
		name: 'DAD - Warning Packet Error',
		description: 'DAD - Warning Packet Error',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'DAD',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'dad',
			},
		],
		callback: async (feedback) => {
			const antennaWarningPacketError = self.state.antennas.get(
				feedback.options.dad as AntennaPortId,
			)?.warningPacketError
			return antennaWarningPacketError === true
		},
	}
	feedbacks['dadIdenitify'] = {
		type: 'boolean',
		name: 'DAD - Identify',
		description: 'DAD - Identify',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'DAD',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'dad',
			},
		],
		callback: async (feedback) => {
			const antennaIdenitify = self.state.antennas.get(feedback.options.dad as AntennaPortId)?.identify
			return antennaIdenitify === true
		},
	}
	feedbacks['dadTemperature'] = {
		type: 'boolean',
		name: 'DAD - Temperature',
		description: 'DAD - Temperature',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'DAD',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'dad',
			},
			{
				type: 'textinput',
				label: 'Temperature (°C)',
				default: '25',
				id: 'temperature',
			},
		],
		callback: async (feedback) => {
			const antennaTemperature = self.state.antennas.get(feedback.options.dad as AntennaPortId)?.temperature
			return antennaTemperature === feedback.options.temperature
		},
	}
	feedbacks['dadLedBrightness'] = {
		type: 'boolean',
		name: 'DAD - LED Brightness',
		description: 'DAD - LED Brightness',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'DAD',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'dad',
			},
			{
				type: 'dropdown',
				label: 'LED Brightness',
				choices: getChoicesFromEnum(LedBrightness),
				default: LedBrightness.Standard,
				id: 'ledBrightness',
			},
		],
		callback: async (feedback) => {
			const antennaLedBrightness = self.state.antennas.get(feedback.options.dad as AntennaPortId)?.ledBrightness
			return antennaLedBrightness === feedback.options.ledBrightness
		},
	}
	feedbacks['dadBindings'] = {
		type: 'boolean',
		name: 'DAD - RF Channel',
		description: 'DAD - RF Channel',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'DAD',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'dad',
			},
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: getChoicesFromEnum(RFChannels),
				default: RFChannels['RF Channel 1'],
				id: 'bindings',
			},
		],
		callback: async (feedback) => {
			const antennaBinding = self.state.antennas.get(feedback.options.dad as AntennaPortId)?.bindings[0].binding
			return antennaBinding === feedback.options.bindings
		},
	}

	//Mobile Device Feedbacks
	const mobileDeviceChoices = getMobileDeviceChoices(self.state)
	const sekMobileDeviceChoices = getMobileDeviceChoices(self.state, MtType.SEK)

	feedbacks['mobileDeviceIdentify'] = {
		type: 'boolean',
		name: 'Mobile Device - Identify',
		description: 'Indicates if the mobile device is identifying',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.identify === true
		},
	}

	feedbacks['mobileDeviceReverseIdentify'] = {
		type: 'boolean',
		name: 'Mobile Device - Reverse Identify',
		description: 'Indicates if the mobile device is reverse identifying',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.reverseIdentify === true
		},
	}

	feedbacks['mobileDeviceConnected'] = {
		type: 'boolean',
		name: 'Mobile Device - Connected',
		description: 'Indicates if the mobile device is connected',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.connected === true
		},
	}

	feedbacks['mobileDeviceState'] = {
		type: 'boolean',
		name: 'Mobile Device - State',
		description: 'Check the state of the mobile device',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: MtState.Connected,
				choices: getChoicesFromEnum(MtState),
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.state === feedback.options.state
		},
	}

	feedbacks['mobileDeviceBatteryLow'] = {
		type: 'boolean',
		name: 'Mobile Device - Battery Low',
		description: 'Indicates if the mobile device battery is low',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.batteryLow === true
		},
	}

	feedbacks['mobileDeviceInterference'] = {
		type: 'boolean',
		name: 'Mobile Device - Interference',
		description: 'Check for interference severity on the mobile device',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'Severity',
				id: 'severity',
				default: Interference.High,
				choices: getChoicesFromEnum(Interference),
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.interference?.severity === feedback.options.severity
		},
	}

	feedbacks['mobileDeviceDominantAntenna'] = {
		type: 'boolean',
		name: 'Mobile Device - Dominant Antenna',
		description: 'Check the dominant antenna of the mobile device',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'Antenna',
				id: 'antenna',
				default: AntennaPortId.A,
				choices: getChoicesFromEnum(AntennaPortId),
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.dominantAntenna === feedback.options.antenna
		},
	}

	feedbacks['mobileDeviceHeadphonePlugState'] = {
		type: 'boolean',
		name: 'Mobile Device - Headphone Plugged',
		description: 'Indicates if the headphone is plugged in (SEK only)',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.headphonePlugState === 'Plugged'
			}
			return false
		},
	}

	feedbacks['iemAudioLinkMatch'] = {
		type: 'boolean',
		name: 'SEK - IEM Audio Link Match',
		description: 'Indicates if two SEKs share the same audio link',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'SEK 1',
				id: 'mtUid1',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'SEK 2',
				id: 'mtUid2',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device1 = self.state.mobileDevices.get(Number(feedback.options.mtUid1))
			const device2 = self.state.mobileDevices.get(Number(feedback.options.mtUid2))
			if (device1?.type === MtType.SEK && device2?.type === MtType.SEK) {
				if (device1.iemAudiolinkId !== -1 && device2.iemAudiolinkId !== -1) {
					return device1.iemAudiolinkId === device2.iemAudiolinkId
				}
			}
			return false
		},
	}

	feedbacks['iemAudioLinkActive'] = {
		type: 'boolean',
		name: 'SEK - IEM Audio Link Active',
		description: 'Indicates if the IEM audio link is active',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'SEK',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.iemAudiolinkActive === true
			}
			return false
		},
	}

	feedbacks['iemAudioInputLinked'] = {
		type: 'boolean',
		name: 'SEK - IEM Audio Input Linked',
		description: 'Indicates if the IEM audio input is linked to the SEK',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'SEK',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'Audio Input',
				choices: getAudioLinkChoices(self.state),
				default: 0,
				id: 'inputId',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			const inputId = Number(feedback.options.inputId)
			if (device?.type === MtType.SEK && device.iemAudiolinkId !== -1) {
				return self.state.audioInputs.get(inputId)?.iemAudiolinkId === device.iemAudiolinkId
			}
			return false
		},
	}

	feedbacks['mobileDeviceOutputLinked'] = {
		type: 'boolean',
		name: 'Mobile Device - Output Linked',
		description: 'Indicates if the mobile device is linked to an audio output',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
				choices: mobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'Audio Output',
				choices: Array.from(self.state.audioOutputs.values()).map((o) => ({
					id: o.outputId,
					label: `Output ${o.outputId + 1}`,
				})),
				default: 0,
				id: 'outputId',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			const outputId = Number(feedback.options.outputId)
			if (device?.micAudiolinkId !== -1) {
				return self.state.audioOutputs.get(outputId)?.micAudiolinkId === device?.micAudiolinkId
			}
			return false
		},
	}

	//Base Station Feedbacks
	feedbacks['baseStationState'] = {
		type: 'boolean',
		name: 'Base Station State',
		description: 'Base Station State',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'State',
				choices: getChoicesFromEnum(BaseStationStatus),
				default: BaseStationStatus.Normal,
				id: 'state',
			},
		],
		callback: async (feedback) => {
			const baseStationState = self.state.basestation?.state
			return baseStationState?.state === feedback.options.state
		},
	}
	feedbacks['baseStationWarnings'] = {
		type: 'boolean',
		name: 'Base Station - Warnings',
		description: 'Indicates if the Base Station has any active warnings',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
		},
		options: [],
		callback: async () => {
			const basestationWarning = self.state.basestation.state?.warnings
			return basestationWarning !== undefined && basestationWarning.length > 0
		},
	}
	feedbacks['baseStationPsu'] = {
		type: 'boolean',
		name: 'Base Station - PSU',
		description: 'Indicates if the Base Station has any active PSU warnings',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'PSU',
				choices: [
					{ id: 'psu1', label: 'PSU 1' },
					{ id: 'psu2', label: 'PSU 2' },
				],
				default: 'psu1',
				id: 'psu',
			},
		],
		callback: async (feedback) => {
			const basestationPsu = self.state.health.psu[feedback.options.psu as keyof PsuState]
			return basestationPsu === PsuStatus.Connected
		},
	}
	feedbacks['mobileDeviceFrequencyRange'] = {
		type: 'boolean',
		name: 'Mobile Device - Frequency Range',
		description: 'Check the frequency range of the mobile device',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Frequency Range',
				id: 'range',
				default: '',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.frequencyRange === feedback.options.range
		},
	}

	feedbacks['mobileDeviceRfChannelId'] = {
		type: 'boolean',
		name: 'Mobile Device - RF Channel ID',
		description: 'Check the RF Channel ID of the mobile device',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: [
					{ label: 'Off', id: -1 },
					{ label: 'RF Channel 1', id: 0 },
					{ label: 'RF Channel 2', id: 1 },
				],
				default: 0,
				id: 'rfChannelId',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			const rfChannelId = feedback.options.rfChannelId === -1 ? undefined : (feedback.options.rfChannelId as number)
			return device?.rfChannelId === rfChannelId
		},
	}

	feedbacks['mobileDeviceSleep'] = {
		type: 'boolean',
		name: 'Mobile Device - Sleep',
		description: 'Indicates if the mobile device is sleeping',
		defaultStyle: {
			bgcolor: Color.SpecteraBlue,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.sleep === true
		},
	}

	feedbacks['mobileDeviceBatteryLevel'] = {
		type: 'boolean',
		name: 'Mobile Device - Battery Level',
		description: 'Check if battery level is below a threshold',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Threshold (%)',
				id: 'threshold',
				default: '10',
				useVariables: true,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			const level = device?.batteryFillLevel
			return level !== undefined && level <= Number(feedback.options.threshold)
		},
	}

	feedbacks['mobileDeviceBatteryRuntime'] = {
		type: 'boolean',
		name: 'Mobile Device - Battery Runtime',
		description: 'Check if battery runtime is below a threshold',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Threshold (minutes)',
				id: 'threshold',
				default: '30',
				useVariables: true,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			const runtime = device?.batteryRuntime
			return runtime !== undefined && runtime <= Number(feedback.options.threshold)
		},
	}

	feedbacks['mobileDeviceLedBrightness'] = {
		type: 'boolean',
		name: 'Mobile Device - LED Brightness',
		description: 'Check LED Brightness',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'Brightness',
				id: 'brightness',
				default: LedBrightness.Standard,
				choices: getChoicesFromEnum(LedBrightness),
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.ledBrightness === feedback.options.brightness
		},
	}

	feedbacks['mobileDeviceMicAudiolinkActive'] = {
		type: 'boolean',
		name: 'Mobile Device - Mic Audio Link Active',
		description: 'Check if Mic Audio Link is Active',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.micAudiolinkActive === true
		},
	}

	feedbacks['mobileDeviceMicTestToneEnabled'] = {
		type: 'boolean',
		name: 'Mobile Device - Mic Test Tone Enabled',
		description: 'Check if Mic Test Tone is Enabled',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.micTestToneEnabled === true
		},
	}

	feedbacks['mobileDeviceMicTestToneLevel'] = {
		type: 'boolean',
		name: 'Mobile Device - Mic Test Tone Level',
		description: 'Check Mic Test Tone Level',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Level (dB)',
				id: 'level',
				default: '-20',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.micTestToneLevel === Number(feedback.options.level)
		},
	}

	feedbacks['mobileDeviceHeadphoneVolume'] = {
		type: 'boolean',
		name: 'Mobile Device - Headphone Volume',
		description: 'Check Headphone Volume (SEK only)',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Volume (-100 to 27.5)',
				id: 'volume',
				default: '-20',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.headphoneVolume === Number(feedback.options.volume)
			}
			return false
		},
	}

	feedbacks['mobileDeviceHeadphoneBalance'] = {
		type: 'boolean',
		name: 'Mobile Device - Headphone Balance',
		description: 'Check Headphone Balance (SEK only)',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Balance (-100 to 100)',
				id: 'balance',
				default: '0',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.headphoneBalance === Number(feedback.options.balance)
			}
			return false
		},
	}

	feedbacks['mobileDeviceMicPreampGain'] = {
		type: 'boolean',
		name: 'Mobile Device - Mic Preamp Gain',
		description: 'Check Mic Preamp Gain',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Gain (dB)',
				id: 'gain',
				default: '12',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			return device?.micPreampGain === Number(feedback.options.gain)
		},
	}

	feedbacks['mobileDeviceMicLowCutHz'] = {
		type: 'boolean',
		name: 'Mobile Device - Mic Low Cut Hz',
		description: 'Check Mic Low Cut Frequency',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'Frequency',
				id: 'frequency',
				default: MicLowCutHzSEK.Off,
				choices: getChoicesFromEnum(MicLowCutHzSEK),
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			const frequency = Number(feedback.options.frequency)

			if (device?.type === MtType.SKM) {
				const deviceVal = (device as any).micLowCutHz
				if (frequency === 20 || frequency === 30 || frequency === 60) {
					// Treat 20, 30, and 60 as matching "Off" (60 for SKM)
					return deviceVal === 60
				}
				return deviceVal === frequency
			}

			return (device as any)?.micLowCutHz === frequency
		},
	}

	feedbacks['mobileDeviceHeadphoneVolumeLimit'] = {
		type: 'boolean',
		name: 'Mobile Device - Headphone Volume Limit',
		description: 'Check Headphone Volume Limit (SEK only)',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Limit',
				id: 'limit',
				default: '0',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.headphoneVolumeLimit === Number(feedback.options.limit)
			}
			return false
		},
	}

	feedbacks['mobileDeviceHeadphoneVolumeMax'] = {
		type: 'boolean',
		name: 'Mobile Device - Headphone Volume Max',
		description: 'Check Headphone Volume Max (SEK only)',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Max',
				id: 'max',
				default: '0',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.headphoneVolumeMax === Number(feedback.options.max)
			}
			return false
		},
	}

	feedbacks['mobileDeviceHeadphoneVolumeMin'] = {
		type: 'boolean',
		name: 'Mobile Device - Headphone Volume Min',
		description: 'Check Headphone Volume Min (SEK only)',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Min',
				id: 'min',
				default: '0',
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.headphoneVolumeMin === Number(feedback.options.min)
			}
			return false
		},
	}

	feedbacks['mobileDeviceMicLineSelection'] = {
		type: 'boolean',
		name: 'Mobile Device - Mic/Line Selection',
		description: 'Check Mic/Line Selection (SEK only)',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'Selection',
				id: 'selection',
				default: MicLineSelection.Auto,
				choices: getChoicesFromEnum(MicLineSelection),
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.micLineSelection === feedback.options.selection
			}
			return false
		},
	}

	feedbacks['mobileDeviceMicLineSelectionAutoValue'] = {
		type: 'boolean',
		name: 'Mobile Device - Mic/Line Auto Value',
		description: 'Check Mic/Line Auto Value (SEK only)',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'Auto Value',
				id: 'autoValue',
				default: MicLineSelectionAuto.Unknown,
				choices: getChoicesFromEnum(MicLineSelectionAuto),
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.micLineSelectionAutoValue === feedback.options.autoValue
			}
			return false
		},
	}

	feedbacks['mobileDeviceCableEmulation'] = {
		type: 'boolean',
		name: 'Mobile Device - Cable Emulation',
		description: 'Check Cable Emulation (SEK only)',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : 0,
				choices: sekMobileDeviceChoices,
			},
			{
				type: 'dropdown',
				label: 'Emulation',
				id: 'emulation',
				default: CableEmulation.Off,
				choices: getChoicesFromEnum(CableEmulation),
			},
		],
		callback: async (feedback) => {
			const device = self.state.mobileDevices.get(Number(feedback.options.mtUid))
			if (device?.type === MtType.SEK) {
				return device.cableEmulation === feedback.options.emulation
			}
			return false
		},
	}

	feedbacks['audioLevelThreshold'] = {
		type: 'boolean',
		name: 'Audio Level - Threshold',
		description: 'Trigger when audio level exceeds a threshold',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'interface',
				default: 'danteIn',
				choices: [
					{ id: 'danteIn', label: 'Dante In' },
					{ id: 'danteOut', label: 'Dante Out' },
					{ id: 'madi1In', label: 'MADI 1 In' },
					{ id: 'madi1Out', label: 'MADI 1 Out' },
					{ id: 'madi2In', label: 'MADI 2 In' },
					{ id: 'madi2Out', label: 'MADI 2 Out' },
				],
			},
			{
				type: 'textinput',
				label: 'Channel (1-32)',
				id: 'channel',
				default: '1',
				useVariables: true,
			},
			{
				type: 'textinput',
				label: 'Threshold (dBFS)',
				id: 'threshold',
				default: '-20',
				useVariables: true,
			},
		],
		callback: async (feedback) => {
			const levels = self.state.audioLevels
			const iface = feedback.options.interface as
				| 'danteIn'
				| 'danteOut'
				| 'madi1In'
				| 'madi1Out'
				| 'madi2In'
				| 'madi2Out'
			const channel = Number(feedback.options.channel) - 1
			const threshold = Number(feedback.options.threshold)

			const levelData = levels[iface]
			if (levelData && levelData.peak[channel] !== undefined) {
				return levelData.peak[channel] >= threshold
			}

			return false
		},
	}

	feedbacks['audioInterfaceStatus'] = {
		type: 'boolean',
		name: 'Audio Interface - Status',
		description: 'Audio Interface - Status',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Interface',
				choices: [
					{ label: 'Dante I/O', id: 'audioNetwork' },
					{ label: 'MADI 1 Input', id: 'madi1In' },
					{ label: 'MADI 1 Output', id: 'madi1Out' },
					{ label: 'MADI 2 Input', id: 'madi2In' },
					{ label: 'MADI 2 Output', id: 'madi2Out' },
					{ label: 'Word Clock Input', id: 'wordclockIn' },
					{ label: 'Word Clock Output', id: 'wordclockOut' },
				],
				default: 'audioNetwork',
				id: 'interface',
			},
			{
				type: 'dropdown',
				label: 'Status',
				choices: getChoicesFromEnum(InterfaceInputStatus),
				default: InterfaceInputStatus.Locked,
				id: 'status',
			},
		],
		callback: async (feedback) => {
			const interfaceId = feedback.options.interface as
				| 'audioNetwork'
				| 'madi1In'
				| 'madi1Out'
				| 'madi2In'
				| 'madi2Out'
				| 'wordclockIn'
				| 'wordclockOut'
			let status: InterfaceInputStatus | undefined

			switch (interfaceId) {
				case 'audioNetwork':
					status = self.state.audioNetwork?.status
					break
				case 'madi1In':
					status = self.state.madi1?.inputStatus.status
					break
				case 'madi1Out':
					status = self.state.madi1?.outputStatus.clockSourceStatus
					break
				case 'madi2In':
					status = self.state.madi2?.inputStatus.status
					break
				case 'madi2Out':
					status = self.state.madi2?.outputStatus.clockSourceStatus
					break
				case 'wordclockIn':
					status = self.state.wordclock?.inputStatus.status
					break
				case 'wordclockOut':
					status = self.state.wordclock?.outputStatus.clockSourceStatus
					break
			}

			return status === feedback.options.status
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
