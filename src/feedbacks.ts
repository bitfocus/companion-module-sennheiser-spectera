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
	MicLowCutHzSKM,
	InterfaceInputStatus,
	InputSource,
} from './types.js'
import {
	audioOutputChannelChoices,
	CONFIRMABLE_ACTIONS,
	getChoicesFromEnum,
	getDeviceBySerial,
	getMobileDeviceChoices,
	getAudioLinkChoices,
	rfChannelChoices,
	STEREO_INPUT_OFFSET,
} from './utils.js'
import { Color } from './utils.js'

export function UpdateFeedbacks(self: SpecteraInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	feedbacks['rfTxPower'] = {
		type: 'boolean',
		name: 'RF - Tx Power',
		description: 'RF - Tx Power',
		defaultStyle: {
			bgcolor: Color.SpecteraBlue,
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
			bgcolor: Color.SpecteraBlue,
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
			bgcolor: Color.SpecteraBlue,
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
			bgcolor: Color.SpecteraBlue,
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
			bgcolor: Color.SpecteraBlue,
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
			bgcolor: Color.SpecteraBlue,
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
	feedbacks['dadAntennaPresent'] = {
		type: 'boolean',
		name: 'DAD - Antenna present',
		description: 'True when the DAD is not Unconnected (hardware present on the port)',
		defaultStyle: {
			bgcolor: Color.LightGray,
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
			const antennaState = self.state.antennas.get(feedback.options.dad as AntennaPortId)?.state
			return antennaState !== undefined && antennaState !== DeviceStatus.Unconnected
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
	feedbacks['dadInterference'] = {
		type: 'boolean',
		name: 'DAD - Interference',
		description: 'Check for interference severity on an antenna (DAD)',
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
			{
				type: 'dropdown',
				label: 'Severity',
				id: 'severity',
				default: Interference.High,
				choices: getChoicesFromEnum(Interference),
			},
		],
		callback: async (feedback) => {
			const antenna = self.state.antennas.get(feedback.options.dad as AntennaPortId)
			return (antenna?.interference?.severity ?? 'None') === feedback.options.severity
		},
	}
	feedbacks['dadInterferencePower'] = {
		type: 'boolean',
		name: 'DAD - Interference Noise Threshold',
		description: 'Check for interference noise level on an antenna (DAD)',
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
			{
				type: 'textinput',
				label: 'Noise Level Threshold (dBm)',
				id: 'interferencePower',
				default: '-80',
			},
		],
		callback: async (feedback) => {
			const antenna = self.state.antennas.get(feedback.options.dad as AntennaPortId)
			return (antenna?.interference?.totalPower ?? 0) >= (feedback.options.interferencePower as number)
		},
	}
	feedbacks['dadIdentify'] = {
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
			const antennaIdentify = self.state.antennas.get(feedback.options.dad as AntennaPortId)?.identify
			return antennaIdentify === true
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
				type: 'dropdown',
				label: 'Temperature Unit',
				choices: [
					{ id: 'celsius', label: '°C' },
					{ id: 'fahrenheit', label: '°F' },
				],
				default: 'celsius',
				id: 'temperatureUnit',
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
			if (!antennaTemperature) return false
			if (feedback.options.temperatureUnit === 'celsius') {
				return antennaTemperature > (feedback.options.temperature as number)
			} else {
				return antennaTemperature > ((feedback.options.temperature as number) * 9) / 5 + 32
			}
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
			bgcolor: Color.SpecteraBlue,
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			return device?.reverseIdentify === true
		},
	}

	feedbacks['mobileDeviceConnected'] = {
		type: 'boolean',
		name: 'Mobile Device - Connected',
		description: 'Indicates if the mobile device is connected',
		defaultStyle: {
			bgcolor: Color.LightGray,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			return device?.connected === true
		},
	}

	feedbacks['mobileDeviceState'] = {
		type: 'boolean',
		name: 'Mobile Device - State',
		description: 'Check the state of the mobile device',
		defaultStyle: {
			bgcolor: Color.SpecteraBlue,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: MtState.Connected,
				choices: getChoicesFromEnum(MtState),
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Severity',
				id: 'severity',
				default: Interference.High,
				choices: getChoicesFromEnum(Interference),
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Antenna',
				id: 'antenna',
				default: AntennaPortId.A,
				choices: getChoicesFromEnum(AntennaPortId),
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (device?.type === MtType.SEK) {
				return device.headphonePlugState === 'Plugged'
			}
			return false
		},
	}

	feedbacks['iemAudioLinkMatch'] = {
		type: 'boolean',
		name: 'Mobile Device - IEM Audio Link Match',
		description: 'Indicates if two SEKs share the same audio link',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'SEK 1',
				id: 'serial1',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'SEK 2',
				id: 'serial2',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial1 = await context.parseVariablesInString(feedback.options.serial1 as string)
			const serial2 = await context.parseVariablesInString(feedback.options.serial2 as string)
			const device1 = getDeviceBySerial(self.state, serial1)
			const device2 = getDeviceBySerial(self.state, serial2)
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
		name: 'Mobile Device - IEM Audio Link Active',
		description: 'Indicates if the IEM audio link is active',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'SEK',
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (device?.type === MtType.SEK) {
				return device.iemAudiolinkActive === true
			}
			return false
		},
	}

	feedbacks['iemAudioInputLinked'] = {
		type: 'boolean',
		name: 'Mobile Device - IEM Audio Input Linked',
		description: 'Indicates if the IEM audio input is linked to the SEK',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'SEK',
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Audio Input',
				choices: getAudioLinkChoices(self.state),
				default: 0,
				id: 'inputId',
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			const rawId = Number(feedback.options.inputId)
			const inputId = rawId >= STEREO_INPUT_OFFSET ? rawId - STEREO_INPUT_OFFSET : rawId
			if (device?.type === MtType.SEK && device.iemAudiolinkId !== -1) {
				return self.state.audioInputs.get(inputId)?.iemAudiolinkId === device.iemAudiolinkId
			}
			return false
		},
	}

	feedbacks['iemAudioInputNoLinkId'] = {
		type: 'boolean',
		name: 'Mobile Device - IEM No Active Link ID',
		description: 'Indicates if the IEM audio input has no active link ID',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'SEK',
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (device?.type === MtType.SEK && device.iemAudiolinkId === -1) {
				return true
			}
			return false
		},
	}

	feedbacks['audioInputInterface'] = {
		type: 'boolean',
		name: 'Audio Input - Interface',
		description: 'Indicates when the selected audio input interface (Dante, MADI 1, MADI 2) is On or Off',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Audio Input',
				choices: Array.from(self.state.audioInputs.values()).map((i) => ({
					id: i.inputId,
					label: i.name || `Input ${i.inputId + 1}`,
				})),
				default: 0,
				id: 'inputId',
			},
			{
				type: 'dropdown',
				label: 'Interface',
				choices: getChoicesFromEnum(InputSource),
				default: InputSource.Dante,
				id: 'interface',
			},
		],
		callback: async (feedback) => {
			const inputId = feedback.options.inputId as number
			const currentSource = self.state.audioInputs.get(inputId)?.source
			return currentSource === feedback.options.interface
		},
	}

	feedbacks['audioOutputInterface'] = {
		type: 'boolean',
		name: 'Audio Output - Interface',
		description: 'Indicates when the selected audio output interface (Dante, MADI 1, MADI 2) is On or Off',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
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
			{
				type: 'dropdown',
				label: 'Interface',
				choices: [
					{ id: 'commandModeAudioNetwork', label: 'Dante' },
					{ id: 'commandModeMadi1', label: 'MADI 1' },
					{ id: 'commandModeMadi2', label: 'MADI 2' },
				],
				default: 'commandModeAudioNetwork',
				id: 'interface',
			},
			{
				type: 'dropdown',
				label: 'State',
				choices: [
					{ id: 'On', label: 'On' },
					{ id: 'Off', label: 'Off' },
				],
				default: 'On',
				id: 'state',
			},
		],
		callback: async (feedback) => {
			const outputId = feedback.options.outputId as number
			const iface = feedback.options.interface as 'commandModeAudioNetwork' | 'commandModeMadi1' | 'commandModeMadi2'
			const current = self.state.audioOutputs.get(outputId)?.[iface]
			return current === feedback.options.state
		},
	}

	feedbacks['mobileDeviceOutputLinked'] = {
		type: 'boolean',
		name: 'Mobile Device - Output Linked',
		description: 'Indicates if the mobile device is linked to an audio output',
		defaultStyle: {
			bgcolor: Color.SpecteraBlue,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'serial',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : '',
				choices: mobileDeviceChoices,
				allowCustom: true,
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
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Frequency Range',
				id: 'range',
				default: '',
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
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
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Threshold (%)',
				id: 'threshold',
				default: '10',
				useVariables: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Threshold (minutes)',
				id: 'threshold',
				default: '30',
				useVariables: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Brightness',
				id: 'brightness',
				default: LedBrightness.Standard,
				choices: getChoicesFromEnum(LedBrightness),
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			return device?.ledBrightness === feedback.options.brightness
		},
	}

	feedbacks['mobileDeviceMicAudiolinkActive'] = {
		type: 'boolean',
		name: 'Mobile Device - Mic Audio Link Active',
		description: 'Check if Mic Audio Link is Active',
		defaultStyle: {
			bgcolor: Color.SpecteraBlue,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Level (dB)',
				id: 'level',
				default: '-20',
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Volume (-100 to 27.5)',
				id: 'volume',
				default: '-20',
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Balance (-100 to 100)',
				id: 'balance',
				default: '0',
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Gain (dB)',
				id: 'gain',
				default: '12',
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: mobileDeviceChoices[0].id,
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Frequency',
				id: 'frequency',
				default: MicLowCutHzSEK.Off,
				choices: getChoicesFromEnum(MicLowCutHzSEK),
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			const frequency = Number(feedback.options.frequency)
			if (!device) return false
			const deviceHz = Number(device.micLowCutHz)

			if (device.type === MtType.SKM) {
				if (frequency === 20 || frequency === 30 || frequency === 60) {
					// Treat 20, 30, and 60 as matching "Off" (60 for SKM)
					return device.micLowCutHz === MicLowCutHzSKM.Off
				}
				return deviceHz === frequency
			}

			return deviceHz === frequency
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
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Limit',
				id: 'limit',
				default: '0',
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Max',
				id: 'max',
				default: '0',
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Min',
				id: 'min',
				default: '0',
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Selection',
				id: 'selection',
				default: MicLineSelection.Auto,
				choices: getChoicesFromEnum(MicLineSelection),
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Auto Value',
				id: 'autoValue',
				default: MicLineSelectionAuto.Unknown,
				choices: getChoicesFromEnum(MicLineSelectionAuto),
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Emulation',
				id: 'emulation',
				default: CableEmulation.Off,
				choices: getChoicesFromEnum(CableEmulation),
			},
		],
		callback: async (feedback, context) => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
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

	feedbacks['mobileDeviceMicLqi'] = {
		type: 'boolean',
		name: 'Mobile Device - Mic LQI',
		description: 'Check Mic LQI value for a mobile device',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'serial',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : '',
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Mic LQI Threshold (0-4)',
				id: 'micLqiThreshold',
				default: '4',
				useVariables: true,
			},
		],
		callback: async (feedback, context): Promise<boolean> => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device?.micLqi) return false
			return device.micLqi >= Number(feedback.options.micLqiThreshold)
		},
	}

	feedbacks['mobileDeviceIemLqi'] = {
		type: 'boolean',
		name: 'Mobile Device - IEM LQI',
		description: 'Check IEM LQI value for a mobile device',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'serial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'IEM LQI Threshold (0-4)',
				id: 'iemLqiThreshold',
				default: '4',
				useVariables: true,
			},
		],
		callback: async (feedback, context): Promise<boolean> => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (device?.type !== MtType.SEK || !device?.iemLqi) return false
			return device.iemLqi >= Number(feedback.options.iemLqiThreshold)
		},
	}

	feedbacks['mobileDeviceRSSI'] = {
		type: 'boolean',
		name: 'Mobile Device - RSSI',
		description: 'Check RSSI value for a mobile device',
		defaultStyle: {
			bgcolor: Color.SpecteraGreen,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'serial',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : '',
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'RSSI Threshold (dBm)',
				id: 'rssiThreshold',
				default: '-20',
			},
		],
		callback: async (feedback, context): Promise<boolean> => {
			const serial = await context.parseVariablesInString(feedback.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device?.rssi) return false
			return device.rssi >= Number(feedback.options.rssiThreshold)
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

	const mobileDeviceChoicesForConfirm = getMobileDeviceChoices(self.state)
	const audioInputChoicesForConfirm = Array.from(self.state.audioInputs.values()).map((i) => ({
		id: i.inputId,
		label: i.name || `Input ${i.inputId + 1}`,
	}))
	const audioOutputChoicesForConfirm = Array.from(self.state.audioOutputs.values()).map((o) => ({
		id: o.outputId,
		label: `Output ${o.outputId + 1}`,
	}))

	feedbacks['confirmPending'] = {
		type: 'boolean',
		name: 'Confirm Pending',
		description: 'Enabled when an action that matches the selected confirmation parameters is awaiting a second press',
		defaultStyle: {
			bgcolor: Color.SpecteraRed,
			color: Color.White,
			text: 'CONFIRM?',
			size: 12,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Action Type',
				id: 'actionType',
				choices: [...CONFIRMABLE_ACTIONS],
				default: CONFIRMABLE_ACTIONS[0].id,
			},
			// rfFrequency fields
			{
				type: 'dropdown',
				label: 'RF Channel',
				id: 'rfFrequency_rfChannel',
				choices: rfChannelChoices,
				default: 0,
				isVisibleExpression: '$(options:actionType) === "rfFrequency"',
			},
			{
				type: 'textinput',
				label: 'Frequency (MHz)',
				id: 'rfFrequency_frequency',
				default: '',
				useVariables: true,
				isVisibleExpression: '$(options:actionType) === "rfFrequency"',
			},
			// setAudioInputInterface fields
			{
				type: 'multidropdown',
				label: 'Audio Input',
				id: 'setAudioInputInterface_inputId',
				choices: audioInputChoicesForConfirm,
				default: [0],
				isVisibleExpression: '$(options:actionType) === "setAudioInputInterface"',
			},
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'setAudioInputInterface_interface',
				choices: getChoicesFromEnum(InputSource),
				default: InputSource.Dante,
				isVisibleExpression: '$(options:actionType) === "setAudioInputInterface"',
			},
			{
				type: 'dropdown',
				label: 'Mode',
				id: 'setAudioInputInterface_mode',
				choices: [
					{ id: 'On', label: 'On' },
					{ id: 'Toggle', label: 'Toggle' },
				],
				default: 'On',
				isVisibleExpression: '$(options:actionType) === "setAudioInputInterface"',
			},
			// dadRfBinding fields
			{
				type: 'dropdown',
				label: 'DAD',
				id: 'dadRfBinding_dad',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				isVisibleExpression: '$(options:actionType) === "dadRfBinding"',
			},
			{
				type: 'dropdown',
				label: 'RF Channel',
				id: 'dadRfBinding_rfChannel',
				choices: [
					{ label: 'RF Channel 1', id: RFChannels['RF Channel 1'] },
					{ label: 'RF Channel 2', id: RFChannels['RF Channel 2'] },
					{ label: 'Scan', id: RFChannels.Scan },
				],
				default: RFChannels['RF Channel 1'],
				isVisibleExpression: '$(options:actionType) === "dadRfBinding"',
			},
			// setAudioOutputInterface fields
			{
				type: 'multidropdown',
				label: 'Audio Output',
				id: 'setAudioOutputInterface_outputId',
				choices: audioOutputChoicesForConfirm,
				default: [0],
				isVisibleExpression: '$(options:actionType) === "setAudioOutputInterface"',
			},
			{
				type: 'dropdown',
				label: 'Interface',
				id: 'setAudioOutputInterface_interface',
				choices: [...audioOutputChannelChoices],
				default: 'commandModeAudioNetwork',
				isVisibleExpression: '$(options:actionType) === "setAudioOutputInterface"',
			},
			{
				type: 'dropdown',
				label: 'Mode',
				id: 'setAudioOutputInterface_mode',
				choices: [
					{ id: 'On', label: 'On' },
					{ id: 'Off', label: 'Off' },
					{ id: 'Toggle', label: 'Toggle' },
				],
				default: 'On',
				isVisibleExpression: '$(options:actionType) === "setAudioOutputInterface"',
			},
			// setRfChannelState fields
			{
				type: 'dropdown',
				label: 'RF Channel',
				id: 'setRfChannelState_rfChannel',
				choices: rfChannelChoices,
				default: 0,
				isVisibleExpression: '$(options:actionType) === "setRfChannelState"',
			},
			{
				type: 'dropdown',
				label: 'RF Channel State',
				id: 'setRfChannelState_state',
				choices: getChoicesFromEnum(RfState),
				default: RfState.Active,
				isVisibleExpression: '$(options:actionType) === "setRfChannelState"',
			},
			// copyAllMobileDeviceSettings fields
			{
				type: 'dropdown',
				label: 'Source Mobile Device',
				id: 'copyAllMobileDeviceSettings_sourceSerial',
				choices: mobileDeviceChoicesForConfirm,
				default: mobileDeviceChoicesForConfirm.length > 0 ? mobileDeviceChoicesForConfirm[0].id : '',
				allowCustom: true,
				isVisibleExpression: '$(options:actionType) === "copyAllMobileDeviceSettings"',
			},
			{
				type: 'dropdown',
				label: 'Target Mobile Device',
				id: 'copyAllMobileDeviceSettings_targetSerial',
				choices: mobileDeviceChoicesForConfirm,
				default: mobileDeviceChoicesForConfirm.length > 0 ? mobileDeviceChoicesForConfirm[0].id : '',
				allowCustom: true,
				isVisibleExpression: '$(options:actionType) === "copyAllMobileDeviceSettings"',
			},
		],
		callback: async (feedback) => {
			const actionType = feedback.options.actionType as string
			const paramMap: Record<string, Record<string, string>> = {
				rfFrequency: { rfChannel: 'rfFrequency_rfChannel', frequency: 'rfFrequency_frequency' },
				setAudioInputInterface: {
					inputId: 'setAudioInputInterface_inputId',
					interface: 'setAudioInputInterface_interface',
					mode: 'setAudioInputInterface_mode',
				},
				dadRfBinding: { dad: 'dadRfBinding_dad', rfChannel: 'dadRfBinding_rfChannel' },
				setAudioOutputInterface: {
					outputId: 'setAudioOutputInterface_outputId',
					interface: 'setAudioOutputInterface_interface',
					mode: 'setAudioOutputInterface_mode',
				},
				copyAllMobileDeviceSettings: {
					sourceSerial: 'copyAllMobileDeviceSettings_sourceSerial',
					targetSerial: 'copyAllMobileDeviceSettings_targetSerial',
				},
				setRfChannelState: {
					rfChannel: 'setRfChannelState_rfChannel',
					state: 'setRfChannelState_state',
				},
			}
			const params = paramMap[actionType]
			if (!params) return false
			const options: Record<string, unknown> = {}
			for (const [paramName, optionId] of Object.entries(params)) {
				options[paramName] = feedback.options[optionId]
			}
			const key = self.confirmationKey(actionType, options)
			return self.pendingConfirmations.has(key)
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
