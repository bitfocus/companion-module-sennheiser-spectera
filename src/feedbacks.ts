import type { SpecteraInstance } from './main.js'
import { type CompanionFeedbackDefinitions } from '@companion-module/base'
import {
	AntennaPortId,
	BandwidthMode,
	DeviceStatus,
	LedBrightness,
	BaseStationStatus,
	RFChannels,
	RfState,
	RfStateStartup,
	TxPower,
	PsuState,
	PsuStatus,
	MtState,
	MtType,
	Interference,
} from './types.js'
import { getChoicesFromEnum } from './utils.js'
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
	const mobileDeviceChoices = Array.from(self.state.mobileDevices.values()).map((device) => ({
		id: device.mtUid,
		label: `${device.name} (${device.serial})`,
	}))

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
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
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
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
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
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
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
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
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
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
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
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
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
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
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
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
				choices: mobileDeviceChoices,
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
	self.setFeedbackDefinitions(feedbacks)
}
