import type { SpecteraInstance } from './main.js'
import type { CompanionActionDefinitions } from '@companion-module/base'
import {
	Antenna,
	AntennaPortId,
	BandwidthMode,
	LedBrightness,
	RfChannel,
	RFChannels,
	RfState,
	RfStateStartup,
	TxPower,
} from './types.js'
import { getChoicesFromEnum } from './utils.js'

export function UpdateActions(self: SpecteraInstance): void {
	const actions: CompanionActionDefinitions = {}

	//RF Actions
	actions['setRfChannelState'] = {
		name: 'RF - State',
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
				label: 'RF Channel State',
				choices: getChoicesFromEnum(RfState),
				default: RfState.Active,
				id: 'state',
			},
		],
		description: 'Set the RF Channel',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setRfChannel(
				action.options.rfChannel as string,
				{
					rfChannelId: action.options.rfChannel as number,
					rfState: action.options.state as RfState,
				} as Partial<RfChannel>,
			)
		},
	}

	actions['setRfChannelStartupState'] = {
		name: 'RF - Startup State',
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
				label: 'RF Channel Startup State',
				choices: getChoicesFromEnum(RfStateStartup),
				default: RfStateStartup.Active,
				id: 'state',
			},
		],
		description: 'Set the RF Channel Startup State',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setRfChannel(
				action.options.rfChannel as string,
				{
					rfChannelId: action.options.rfChannel as number,
					rfStateStartup: action.options.state as RfStateStartup,
				} as Partial<RfChannel>,
			)
		},
	}

	actions['rfTxPower'] = {
		name: 'RF - TX Power',
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
				label: 'TX Power',
				choices: getChoicesFromEnum(TxPower),
				default: 10,
				id: 'txPower',
			},
		],
		description: 'Set the RF Channel TX Power',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setRfChannel(
				action.options.rfChannel as string,
				{
					rfChannelId: action.options.rfChannel as number,
					txPower: action.options.txPower as TxPower,
				} as Partial<RfChannel>,
			)
		},
	}

	actions['rfBandwidthMode'] = {
		name: 'RF - Bandwidth Mode',
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
				id: 'bandwidthMode',
			},
		],
		description: 'Set the RF Channel Bandwidth Mode',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setRfChannel(
				action.options.rfChannel as string,
				{
					rfChannelId: action.options.rfChannel as number,
					bandwidthMode: action.options.bandwidthMode as BandwidthMode,
				} as Partial<RfChannel>,
			)
		},
	}

	actions['rfFrequency'] = {
		name: 'RF - Frequency',
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
				default: '474',
				id: 'frequency',
				useVariables: true,
			},
		],
		description: 'Set the RF Channel Frequency',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setRfChannel(
				action.options.rfChannel as string,
				{
					rfChannelId: action.options.rfChannel as number,
					frequency: Number(action.options.frequency) * 1000,
				} as Partial<RfChannel>,
			)
		},
	}

	//DAD Actions
	actions['dadLedBrightness'] = {
		name: 'DAD - LED Brightness',
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
		description: 'Set the DAD LED Brightness',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setAntenna(
				action.options.dad as AntennaPortId,
				{
					antennaPortId: action.options.dad as AntennaPortId,
					ledBrightness: action.options.ledBrightness as LedBrightness,
				} as Partial<Antenna>,
			)
		},
	}

	actions['dadIdentify'] = {
		name: 'DAD - Identify',
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
				label: 'Identify',
				choices: [
					{ id: 'true', label: 'On' },
					{ id: 'false', label: 'Off' },
				],
				default: 'true',
				id: 'identify',
			},
		],
		description: 'Set the DAD Identify',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setAntenna(
				action.options.dad as AntennaPortId,
				{
					antennaPortId: action.options.dad as AntennaPortId,
					identify: action.options.identify === 'true',
				} as Partial<Antenna>,
			)
		},
	}

	actions['dadRfBinding'] = {
		name: 'DAD - RF Channel',
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
				default: RFChannels.Off,
				id: 'rfChannel',
			},
		],
		description: 'Set the DAD RF Channel',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setAntenna(
				action.options.dad as AntennaPortId,
				{
					antennaPortId: action.options.dad as AntennaPortId,
					bindings: [
						{
							subAntennaId: 0,
							binding: action.options.rfChannel as RFChannels,
						},
					],
				} as Partial<Antenna>,
			)
		},
	}

	self.setActionDefinitions(actions)
}
