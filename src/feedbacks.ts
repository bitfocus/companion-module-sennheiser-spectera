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
} from './types.js'
import { getChoicesFromEnum } from './utils.js'
import { Color } from './utils.js'

export function UpdateFeedbacks(self: SpecteraInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	feedbacks['rfTxPower'] = {
		type: 'boolean',
		name: 'RF Tx Power',
		description: 'RF Tx Power',
		defaultStyle: {
			bgcolor: Color.Green,
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
				label: 'RF Tx Power',
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
		name: 'RF Frequency',
		description: 'RF Frequency',
		defaultStyle: {
			bgcolor: Color.Green,
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
		name: 'RF Bandwidth Mode',
		description: 'RF Bandwidth Mode',
		defaultStyle: {
			bgcolor: Color.Green,
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
				label: 'RF Bandwidth Mode',
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
		name: 'RF Restriction Violation',
		description: 'RF Restriction Violation',
		defaultStyle: {
			bgcolor: Color.Red,
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
		name: 'RF State',
		description: 'RF State',
		defaultStyle: {
			bgcolor: Color.Green,
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
				label: 'RF State',
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
		name: 'RF State on Start Up',
		description: 'RF State on Start Up',
		defaultStyle: {
			bgcolor: Color.Green,
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
				label: 'RF State on Start Up',
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
	feedbacks['antennaState'] = {
		type: 'boolean',
		name: 'Antenna State',
		description: 'Antenna State',
		defaultStyle: {
			bgcolor: Color.Green,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Antenna',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'antenna',
			},
			{
				type: 'dropdown',
				label: 'Antenna State',
				choices: getChoicesFromEnum(DeviceStatus),
				default: DeviceStatus.Connected,
				id: 'state',
			},
		],
		callback: async (feedback) => {
			const antennaState = self.state.antennas.get(feedback.options.antenna as AntennaPortId)?.state
			return antennaState === feedback.options.state
		},
	}
	feedbacks['antennaWarningHighTemperature'] = {
		type: 'boolean',
		name: 'Antenna Warning High Temperature',
		description: 'Antenna Warning High Temperature',
		defaultStyle: {
			bgcolor: Color.Red,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Antenna',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'antenna',
			},
		],
		callback: async (feedback) => {
			const antennaWarningHighTemperature = self.state.antennas.get(
				feedback.options.antenna as AntennaPortId,
			)?.warningHighTemperature
			return antennaWarningHighTemperature === true
		},
	}
	feedbacks['antennaWarningPacketError'] = {
		type: 'boolean',
		name: 'Antenna Warning Packet Error',
		description: 'Antenna Warning Packet Error',
		defaultStyle: {
			bgcolor: Color.Red,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Antenna',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'antenna',
			},
		],
		callback: async (feedback) => {
			const antennaWarningPacketError = self.state.antennas.get(
				feedback.options.antenna as AntennaPortId,
			)?.warningPacketError
			return antennaWarningPacketError === true
		},
	}
	feedbacks['antennaIdenitify'] = {
		type: 'boolean',
		name: 'Antenna Identify',
		description: 'Antenna Identify',
		defaultStyle: {
			bgcolor: Color.Green,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Antenna',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'antenna',
			},
		],
		callback: async (feedback) => {
			const antennaIdenitify = self.state.antennas.get(feedback.options.antenna as AntennaPortId)?.identify
			return antennaIdenitify === true
		},
	}
	feedbacks['antennaTemperature'] = {
		type: 'boolean',
		name: 'Antenna Temperature',
		description: 'Antenna Temperature',
		defaultStyle: {
			bgcolor: Color.Green,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Antenna',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'antenna',
			},
			{
				type: 'textinput',
				label: 'Temperature (°C)',
				default: '25',
				id: 'temperature',
			},
		],
		callback: async (feedback) => {
			const antennaTemperature = self.state.antennas.get(feedback.options.antenna as AntennaPortId)?.temperature
			return antennaTemperature === feedback.options.temperature
		},
	}
	feedbacks['antennaLedBrightness'] = {
		type: 'boolean',
		name: 'Antenna LED Brightness',
		description: 'Antenna LED Brightness',
		defaultStyle: {
			bgcolor: Color.Green,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Antenna',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'antenna',
			},
			{
				type: 'dropdown',
				label: 'Antenna LED Brightness',
				choices: getChoicesFromEnum(LedBrightness),
				default: LedBrightness.Standard,
				id: 'ledBrightness',
			},
		],
		callback: async (feedback) => {
			const antennaLedBrightness = self.state.antennas.get(feedback.options.antenna as AntennaPortId)?.ledBrightness
			return antennaLedBrightness === feedback.options.ledBrightness
		},
	}
	feedbacks['antennaBinding'] = {
		type: 'boolean',
		name: 'Antenna Binding',
		description: 'Antenna Binding',
		defaultStyle: {
			bgcolor: Color.Green,
		},
		options: [
			{
				type: 'dropdown',
				label: 'Antenna',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'antenna',
			},
			{
				type: 'dropdown',
				label: 'Antenna Binding',
				choices: getChoicesFromEnum(RFChannels),
				default: RFChannels['RF Channel 1'],
				id: 'binding',
			},
		],
		callback: async (feedback) => {
			const antennaBinding = self.state.antennas.get(feedback.options.antenna as AntennaPortId)?.bindings[0].binding
			return antennaBinding === feedback.options.binding
		},
	}

	//Device Feedbacks
	feedbacks['BaseStationInfo'] = {
		type: 'boolean',
		name: 'Basestation - State',
		description: 'Base Station - State',
		defaultStyle: {
			bgcolor: Color.Green,
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
			const BaseStationInfo = self.state.basestation?.state
			return BaseStationInfo === feedback.options.state
		},
	}
	feedbacks['basestationWarning'] = {
		type: 'boolean',
		name: 'Base Station - Warning',
		description: 'Indicates if the Base Station has any active warnings',
		defaultStyle: {
			bgcolor: Color.Red,
		},
		options: [],
		callback: async () => {
			const basestationWarning = self.state.basestation.state?.warnings
			return basestationWarning !== undefined && basestationWarning.length > 0
		},
	}
	self.setFeedbackDefinitions(feedbacks)
}
