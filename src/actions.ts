import type { SpecteraInstance } from './main.js'
import type { CompanionActionDefinitions } from '@companion-module/base'
import { BandwidthMode, RfChannel, RfState, RfStateStartup, TxPower } from './types.js'
import { getChoicesFromEnum } from './utils.js'

export function UpdateActions(self: SpecteraInstance): void {
	const actions: CompanionActionDefinitions = {}

	//RF Actions
	actions['setRfChannelState'] = {
		name: 'Set RF Channel State',
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
		name: 'Set RF Channel Startup State',
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
		name: 'Set RF Channel TX Power',
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
				label: 'RF Channel TX Power',
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
		name: 'Set RF Channel Bandwidth Mode',
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
				label: 'RF Channel Bandwidth Mode',
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
		name: 'Set RF Channel Frequency',
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
				label: 'RF Channel Frequency (MHz)',
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

	self.setActionDefinitions(actions)
}
