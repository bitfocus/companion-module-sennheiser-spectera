import type { SpecteraInstance } from './main.js'
import type { CompanionActionDefinitions } from '@companion-module/base'
import {
	AudioInput,
	Antenna,
	AntennaPortId,
	BandwidthMode,
	CableEmulation,
	LedBrightness,
	InputSource,
	MobileDevice,
	MtType,
	RfChannel,
	RFChannels,
	RfState,
	RfStateStartup,
	TxPower,
} from './types.js'
import { getChoicesFromEnum, getMobileDeviceChoices } from './utils.js'

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

	actions['setAudioInputSource'] = {
		name: 'Audio Input - Source',
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
				label: 'Source',
				choices: getChoicesFromEnum(InputSource),
				default: InputSource.Dante,
				id: 'source',
			},
		],
		description: 'Set the Audio Input Source',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setAudioInput(
				action.options.inputId as number,
				{
					source: action.options.source as InputSource,
				} as Partial<AudioInput>,
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

	//Mobile Device Actions
	const mobileDeviceChoices = getMobileDeviceChoices(self.state)
	const sekMobileDeviceChoices = getMobileDeviceChoices(self.state, MtType.SEK)

	actions['mobileDeviceRfChannelId'] = {
		name: 'Mobile Device - RF Channel',
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
				label: 'RF Channel',
				choices: [
					{ label: 'Off', id: -1 },
					{ label: 'RF Channel 1', id: 0 },
					{ label: 'RF Channel 2', id: 1 },
				],
				default: 0,
				id: 'rfChannel',
			},
		],
		description: 'Set the RF Channel for a Mobile Device',
		callback: async (action) => {
			if (!self.api) return
			const rfChannelId = action.options.rfChannel === -1 ? undefined : (action.options.rfChannel as number)
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					rfChannelId,
				} as Partial<MobileDevice>,
			)
		},
	}

	actions['mobileDeviceIdentify'] = {
		name: 'Mobile Device - Identify',
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
				label: 'Identify',
				choices: [
					{ id: 'true', label: 'On' },
					{ id: 'false', label: 'Off' },
				],
				default: 'true',
				id: 'identify',
			},
		],
		description: 'Set Identify for a Mobile Device',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					identify: action.options.identify === 'true',
				} as Partial<MobileDevice>,
			)
		},
	}

	actions['mobileDeviceLedBrightness'] = {
		name: 'Mobile Device - LED Brightness',
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
				label: 'LED Brightness',
				choices: getChoicesFromEnum(LedBrightness),
				default: LedBrightness.Standard,
				id: 'ledBrightness',
			},
		],
		description: 'Set LED Brightness for a Mobile Device',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					ledBrightness: action.options.ledBrightness as LedBrightness,
				} as Partial<MobileDevice>,
			)
		},
	}

	actions['mobileDeviceHeadphoneVolume'] = {
		name: 'Mobile Device - Headphone Volume',
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
				label: 'Volume (0-100)',
				default: '50',
				id: 'volume',
				useVariables: true,
			},
		],
		description: 'Set Headphone Volume for a SEK Device',
		callback: async (action) => {
			if (!self.api) return
			const volume = Number(await self.parseVariablesInString(action.options.volume as string))
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					headphoneVolume: volume,
				} as Partial<MobileDevice>,
			)
		},
	}

	actions['mobileDeviceHeadphoneBalance'] = {
		name: 'Mobile Device - Headphone Balance',
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
				default: '0',
				id: 'balance',
				useVariables: true,
			},
		],
		description: 'Set Headphone Balance for a SEK Device',
		callback: async (action) => {
			if (!self.api) return
			const balance = Number(await self.parseVariablesInString(action.options.balance as string))
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					headphoneBalance: balance,
				} as Partial<MobileDevice>,
			)
		},
	}

	actions['mobileDeviceMicPreampGain'] = {
		name: 'Mobile Device - Mic Preamp Gain',
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
				choices: mobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Gain (dB)',
				default: '0',
				id: 'gain',
				useVariables: true,
			},
		],
		description: 'Set Mic Preamp Gain for a Mobile Device',
		callback: async (action) => {
			if (!self.api) return
			const gain = Number(await self.parseVariablesInString(action.options.gain as string))
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					micPreampGain: gain,
				} as Partial<MobileDevice>,
			)
		},
	}

	actions['mobileDeviceMicLowCutHz'] = {
		name: 'Mobile Device - Mic Low Cut Hz',
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
				choices: mobileDeviceChoices,
			},
			{
				type: 'textinput',
				label: 'Frequency (Hz)',
				default: '0',
				id: 'frequency',
				useVariables: true,
			},
		],
		description: 'Set Mic Low Cut Frequency for a Mobile Device',
		callback: async (action) => {
			if (!self.api) return
			const frequency = Number(await self.parseVariablesInString(action.options.frequency as string))
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					micLowCutHz: frequency,
				} as Partial<MobileDevice>,
			)
		},
	}

	actions['mobileDeviceCableEmulation'] = {
		name: 'Mobile Device - Cable Emulation',
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
				label: 'Cable Emulation',
				choices: getChoicesFromEnum(CableEmulation),
				default: CableEmulation.Off,
				id: 'cableEmulation',
			},
		],
		description: 'Set Cable Emulation for a SEK Device',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					cableEmulation: action.options.cableEmulation as CableEmulation,
				} as Partial<MobileDevice>,
			)
		},
	}

	actions['mobileDeviceMicLineSelection'] = {
		name: 'Mobile Device - Mic/Line Selection',
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
				label: 'Mode',
				choices: [
					{ id: 'Mic', label: 'Mic' },
					{ id: 'Line', label: 'Line' },
					{ id: 'Auto', label: 'Auto' },
				],
				default: 'Auto',
				id: 'mode',
			},
		],
		description: 'Set Mic/Line Selection for a SEK Device',
		callback: async (action) => {
			if (!self.api) return
			// Assuming literal string 'Mic' | 'Line' | 'Auto'
			// User request mentioned "micLineSelection?: string" in type definition
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					micLineSelection: action.options.mode as string,
				} as Partial<MobileDevice>,
			)
		},
	}

	actions['mobileDeviceMicTestTone'] = {
		name: 'Mobile Device - Mic Test Tone',
		options: [
			{
				type: 'dropdown',
				label: 'Mobile Device',
				id: 'mtUid',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : 0,
				choices: mobileDeviceChoices,
			},
			{
				type: 'checkbox',
				label: 'Enable',
				default: false,
				id: 'enable',
			},
			{
				type: 'textinput',
				label: 'Level (dB)',
				default: '-20',
				id: 'level',
				useVariables: true,
			},
		],
		description: 'Set Mic Test Tone for a Mobile Device',
		callback: async (action) => {
			if (!self.api) return
			const level = Number(await self.parseVariablesInString(action.options.level as string))
			await self.api.setMobileDevice(
				action.options.mtUid as number,
				{
					micTestToneEnabled: action.options.enable as boolean,
					micTestToneLevel: level,
				} as Partial<MobileDevice>,
			)
		},
	}

	self.setActionDefinitions(actions)
}
