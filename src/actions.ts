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
	MicLineSelection,
	MicLowCutHzSEK,
	MicLowCutHzSKM,
	IemAudiolinkMode,
	MicAudiolinkMode,
} from './types.js'
import {
	getAudioLinkChoices,
	getChoicesFromEnum,
	getDeviceBySerial,
	getMobileDeviceChoices,
	STEREO_INPUT_OFFSET,
} from './utils.js'

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
				id: 'serial',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : '',
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
				id: 'rfChannel',
			},
		],
		description: 'Set the RF Channel for a Mobile Device',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			const rfChannelId = action.options.rfChannel === -1 ? undefined : (action.options.rfChannel as number)
			await self.api.setMobileDevice(device.mtUid, { rfChannelId } as Partial<MobileDevice>)
		},
	}

	actions['mobileDeviceIdentify'] = {
		name: 'Mobile Device - Identify',
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
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDevice(device.mtUid, {
				identify: action.options.identify === 'true',
			} as Partial<MobileDevice>)
		},
	}

	actions['mobileDeviceLedBrightness'] = {
		name: 'Mobile Device - LED Brightness',
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
				label: 'LED Brightness',
				choices: getChoicesFromEnum(LedBrightness),
				default: LedBrightness.Standard,
				id: 'ledBrightness',
			},
		],
		description: 'Set LED Brightness for a Mobile Device',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDevice(device.mtUid, {
				ledBrightness: action.options.ledBrightness as LedBrightness,
			} as Partial<MobileDevice>)
		},
	}

	actions['mobileDeviceHeadphoneVolume'] = {
		name: 'Mobile Device - Headphone Volume',
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
				label: 'Action',
				choices: [
					{ id: 'set', label: 'Set' },
					{ id: 'adjust', label: 'Adjust' },
				],
				default: 'set',
				id: 'action',
			},
			{
				type: 'textinput',
				label: 'Set Volume (-100 to 27.5)',
				default: '-20',
				id: 'volume',
				useVariables: true,
				isVisibleExpression: '$(options:action) === "set"',
			},
			{
				type: 'textinput',
				label: 'Adjustment Amount',
				default: '0.5',
				id: 'adjustment',
				useVariables: true,
				isVisibleExpression: '$(options:action) === "adjust"',
			},
		],
		description: 'Set Headphone Volume for a SEK Device',
		callback: async (action, context) => {
			if (!self.api) return
			let volume = Number(action.options.volume)
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)

			if (device && device.type === MtType.SEK) {
				if (action.options.action === 'adjust') {
					const prevVolume = device.headphoneVolume ?? 0
					volume = prevVolume + Number(action.options.adjustment)
				} else {
					volume = Number(action.options.volume)
				}

				if (volume < -100) volume = -100
				if (volume > 27.5) volume = 27.5
				if (device.headphoneVolumeMax !== undefined && volume > device.headphoneVolumeMax) {
					volume = device.headphoneVolumeMax
				}
				if (device.headphoneVolumeMin !== undefined && volume < device.headphoneVolumeMin) {
					volume = device.headphoneVolumeMin
				}
				await self.api.setMobileDevice(device.mtUid, { headphoneVolume: volume } as Partial<MobileDevice>)
			}
		},
	}

	actions['mobileDeviceHeadphoneBalance'] = {
		name: 'Mobile Device - Headphone Balance',
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
				label: 'Action',
				choices: [
					{ id: 'set', label: 'Set' },
					{ id: 'adjust', label: 'Adjust' },
				],
				default: 'set',
				id: 'action',
			},
			{
				type: 'textinput',
				label: 'Set Balance (-100 to 100)',
				default: '0',
				id: 'balance',
				useVariables: true,
				isVisibleExpression: '$(options:action) === "set"',
			},
			{
				type: 'textinput',
				label: 'Adjustment Amount',
				default: '1',
				id: 'adjustment',
				useVariables: true,
				isVisibleExpression: '$(options:action) === "adjust"',
			},
		],
		description: 'Set Headphone Balance for a SEK Device',
		callback: async (action, context) => {
			if (!self.api) return
			let balance = Number(action.options.balance)
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)

			if (device && device.type === MtType.SEK) {
				if (action.options.action === 'adjust') {
					const prevBalance = device?.headphoneBalance ?? 0
					balance = prevBalance + Number(action.options.adjustment)
				} else {
					balance = Number(action.options.balance)
				}
				if (balance < -100) balance = -100
				if (balance > 100) balance = 100
				await self.api.setMobileDevice(device.mtUid, { headphoneBalance: balance } as Partial<MobileDevice>)
			}
		},
	}

	actions['mobileDeviceMicPreampGain'] = {
		name: 'Mobile Device - Mic Preamp Gain',
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
				label: 'Action',
				choices: [
					{ id: 'set', label: 'Set' },
					{ id: 'adjust', label: 'Adjust' },
				],
				default: 'set',
				id: 'action',
			},
			{
				type: 'textinput',
				label: 'Set Gain (dB)',
				default: '12',
				id: 'gain',
				useVariables: true,
				isVisibleExpression: '$(options:action) === "set"',
			},
			{
				type: 'textinput',
				label: 'Adjustment Amount (dB)',
				default: '12',
				id: 'adjustment',
				useVariables: true,
				isVisibleExpression: '$(options:action) === "adjust"',
			},
		],
		description: 'Set Mic Preamp Gain for a Mobile Device',
		callback: async (action, context) => {
			if (!self.api) return
			let gain = Number(action.options.gain)
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)

			if (device) {
				if (action.options.action === 'adjust') {
					const prevGain = device?.micPreampGain ?? 0
					gain = prevGain + Number(action.options.adjustment)
				} else {
					gain = Number(action.options.gain)
				}
				if (device.type === MtType.SEK) {
					// SEK: Min -6, Max 42
					if (gain < -6) gain = -6
					if (gain > 42) gain = 42
				} else if (device.type === MtType.SKM) {
					// SKM: Min -10, Max 42
					if (gain < -10) gain = -10
					if (gain > 42) gain = 42
				}
				await self.api.setMobileDevice(device.mtUid, { micPreampGain: gain } as Partial<MobileDevice>)
			}
		},
	}

	actions['mobileDeviceMicLowCutHz'] = {
		name: 'Mobile Device - Mic Low Cut Hz',
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
				label: 'Frequency',
				choices: getChoicesFromEnum(MicLowCutHzSEK),
				default: MicLowCutHzSEK.Off,
				id: 'frequency',
			},
		],
		description: 'Set Mic Low Cut Frequency for a Mobile Device',
		callback: async (action, context) => {
			if (!self.api) return
			let frequency = action.options.frequency as number
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return

			if (device.type === MtType.SKM) {
				// SEK-only values (20=Off, 30Hz) are not valid for SKM; remap to SKM Off (60)
				if (frequency === Number(MicLowCutHzSEK.Off) || frequency === 30) {
					frequency = MicLowCutHzSKM.Off
				}
			}

			await self.api.setMobileDevice(device.mtUid, { micLowCutHz: frequency } as Partial<MobileDevice>)
		},
	}

	actions['mobileDeviceCableEmulation'] = {
		name: 'Mobile Device - Cable Emulation',
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
				label: 'Cable Emulation',
				choices: getChoicesFromEnum(CableEmulation),
				default: CableEmulation.Off,
				id: 'cableEmulation',
			},
		],
		description: 'Set Cable Emulation for a SEK Device',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDevice(device.mtUid, {
				cableEmulation: action.options.cableEmulation as CableEmulation,
			} as Partial<MobileDevice>)
		},
	}

	actions['mobileDeviceMicLineSelection'] = {
		name: 'Mobile Device - Mic/Line Selection',
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
				label: 'Mode',
				choices: getChoicesFromEnum(MicLineSelection),
				default: MicLineSelection.Auto,
				id: 'mode',
			},
		],
		description: 'Set Mic/Line Selection for a SEK Device',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDevice(device.mtUid, {
				micLineSelection: action.options.mode as MicLineSelection,
			} as Partial<MobileDevice>)
		},
	}

	actions['mobileDeviceMicTestTone'] = {
		name: 'Mobile Device - Mic Test Tone',
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
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			const level = Number(action.options.level)
			await self.api.setMobileDevice(device.mtUid, {
				micTestToneEnabled: action.options.enable as boolean,
				micTestToneLevel: level,
			} as Partial<MobileDevice>)
		},
	}

	actions['mobileDeviceRename'] = {
		name: 'Mobile Device - Rename',
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
				label: 'Name',
				default: 'Mobile Device',
				id: 'name',
				useVariables: true,
			},
		],
		description: 'Set Name for a Mobile Device',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDevice(device.mtUid, {
				name: action.options.name as string,
			} as Partial<MobileDevice>)
		},
	}

	const audioLinkChoices = getAudioLinkChoices(self.state)
	const stereoModeChoices = getChoicesFromEnum(IemAudiolinkMode).filter((c) => String(c.label).includes('Stereo'))
	const monoModeChoices = getChoicesFromEnum(IemAudiolinkMode).filter((c) => String(c.label).includes('Mono'))

	actions['routeAudioInputToMobileDevice'] = {
		name: 'Audio I/O - Route Input to Mobile Device',
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
				label: 'Audio Input',
				choices: audioLinkChoices,
				default: audioLinkChoices.length > 0 ? audioLinkChoices[0].id : 0,
				id: 'inputId',
			},
			{
				type: 'dropdown',
				label: 'Link Mode',
				choices: stereoModeChoices,
				default: IemAudiolinkMode['LIVE (Stereo)'],
				id: 'modeIdStereo',
				isVisibleExpression: `$(options:inputId) >= ${STEREO_INPUT_OFFSET}`,
			},
			{
				type: 'dropdown',
				label: 'Link Mode',
				choices: monoModeChoices,
				default: IemAudiolinkMode['LIVE (Mono)'],
				id: 'modeIdMono',
				isVisibleExpression: `$(options:inputId) < ${STEREO_INPUT_OFFSET}`,
			},
		],
		description: 'Route an Audio Input to a Mobile Device (IEM). ',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			const rawInputId = Number(action.options.inputId)
			const isStereo = rawInputId >= STEREO_INPUT_OFFSET
			const inputId = isStereo ? rawInputId - STEREO_INPUT_OFFSET : rawInputId
			const modeId = isStereo ? Number(action.options.modeIdStereo) : Number(action.options.modeIdMono)
			await self.api.routeAudioInputToMobileDevice(inputId, device.mtUid, modeId)
		},
	}

	actions['removeIemAudioLink'] = {
		name: 'Audio I/O - Remove IEM Audio Link',
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
		description: 'Remove an IEM Audio Link from a Mobile Device (IEM). ',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDevice(device.mtUid, { iemAudiolinkId: -1 })
		},
	}

	actions['routeMobileDeviceToAudioOutput'] = {
		name: 'Audio I/O - Route Mobile Device to Output',
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
			{
				type: 'dropdown',
				label: 'Link Mode',
				choices: getChoicesFromEnum(MicAudiolinkMode),
				default: MicAudiolinkMode['LIVE (Mono)'],
				id: 'modeId',
			},
		],
		description: 'Route a Mobile Device (Mic) to an Audio Output. ',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			const outputId = Number(action.options.outputId)
			const modeId = Number(action.options.modeId)
			await self.api.routeMobileDeviceToAudioOutput(device.mtUid, outputId, modeId)
		},
	}

	actions['removeDeviceFromAudioOutput'] = {
		name: 'Audio I/O - Remove Device from Output',
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
		],
		description: 'Remove the mobile device currently routed to the selected audio output.',
		callback: async (action) => {
			if (!self.api) return
			const outputId = Number(action.options.outputId)
			await self.api.setAudioOutput(outputId, { micAudiolinkId: -1 })
		},
	}

	const audioOutputChannelChoices = [
		{ id: 'commandModeAudioNetwork', label: 'Dante' },
		{ id: 'commandModeMadi1', label: 'MADI 1' },
		{ id: 'commandModeMadi2', label: 'MADI 2' },
	] as const

	actions['setAudioOutputChannel'] = {
		name: 'Audio Output - Set Channel',
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
				label: 'Channel',
				choices: [...audioOutputChannelChoices],
				default: 'commandModeAudioNetwork',
				id: 'channel',
			},
			{
				type: 'dropdown',
				label: 'Mode',
				choices: [
					{ id: 'On', label: 'On' },
					{ id: 'Off', label: 'Off' },
					{ id: 'Toggle', label: 'Toggle' },
				],
				default: 'On',
				id: 'mode',
			},
		],
		description: 'Set the output channel  for an audio output channel.',
		callback: async (action) => {
			if (!self.api) return
			const outputId = Number(action.options.outputId)
			const channel = action.options.channel as (typeof audioOutputChannelChoices)[number]['id']
			let mode = action.options.mode as 'On' | 'Off' | 'Toggle'
			if (mode === 'Toggle') {
				const current = self.state.audioOutputs.get(outputId)?.[channel]
				mode = current === 'On' ? 'Off' : 'On'
			}
			await self.api.setAudioOutput(outputId, { [channel]: mode })
			self.checkFeedbacks('audioOutputChannel')
		},
	}

	actions['copyAllMobileDeviceSettings'] = {
		name: 'Mobile Device - Copy All Settings',
		options: [
			{
				type: 'dropdown',
				label: 'Source Mobile Device',
				id: 'sourceSerial',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : '',
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Target Mobile Device',
				id: 'targetSerial',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : '',
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
		],
		description: 'Copy all shared settings from one Mobile Device to another.',
		callback: async (action, context) => {
			if (!self.api) return
			const sourceSerial = await context.parseVariablesInString(action.options.sourceSerial as string)
			const targetSerial = await context.parseVariablesInString(action.options.targetSerial as string)
			const sourceDevice = getDeviceBySerial(self.state, sourceSerial)
			const targetDevice = getDeviceBySerial(self.state, targetSerial)
			if (!sourceDevice || !targetDevice) return

			await self.api.copyMobileDeviceSettings(sourceDevice.mtUid, targetDevice.mtUid)
		},
	}

	actions['copyIemAudioLink'] = {
		name: 'Audio I/O - Copy IEM Channels',
		options: [
			{
				type: 'dropdown',
				label: 'Source SEK',
				id: 'sourceSerial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'dropdown',
				label: 'Target SEK',
				id: 'targetSerial',
				default: sekMobileDeviceChoices.length > 0 ? sekMobileDeviceChoices[0].id : '',
				choices: sekMobileDeviceChoices,
				allowCustom: true,
			},
		],
		description: 'Copy the IEM Audio Channels from one SEK to another.',
		callback: async (action, context) => {
			if (!self.api) return
			const sourceSerial = await context.parseVariablesInString(action.options.sourceSerial as string)
			const targetSerial = await context.parseVariablesInString(action.options.targetSerial as string)
			const sourceDevice = getDeviceBySerial(self.state, sourceSerial)
			const targetDevice = getDeviceBySerial(self.state, targetSerial)
			if (!sourceDevice || !targetDevice) return

			await self.api.copyIemAudioLink(sourceDevice.mtUid, targetDevice.mtUid)
		},
	}

	self.setActionDefinitions(actions)
}
