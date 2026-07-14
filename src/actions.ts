import type { SpecteraInstance } from './main.js'
import type { CompanionActionDefinitions } from '@companion-module/base'
import {
	Antenna,
	AntennaPortId,
	BandwidthMode,
	CableEmulation,
	InputSource,
	MtType,
	RFChannels,
	RfState,
	RfStateStartup,
	TxPower,
	MicLineSelection,
	MicLowCutHzSEK,
	MicLowCutHzSKM,
	IemAudiolinkMode,
	MicAudiolinkMode,
	CommandBehavior,
} from './types.js'
import {
	audioOutputChannelChoices,
	audioOutputStateChoices,
	audioOutputInterfaceProps,
	audioOutputCommandContextChoices,
	type AudioOutputInterfaceId,
	type AudioOutputCommandContext,
	getAudioLinkChoices,
	getChoicesFromEnum,
	getDeviceBySerial,
	getMobileDeviceChoices,
	parseMobileDeviceSettingsJson,
	rfChannelChoices,
	sanitizeMobileDeviceName,
	STEREO_INPUT_OFFSET,
	DEFAULT_CONNECTED_STATE_COLOR,
	DEFAULT_LED_COLORS,
	LED_COLOR_PRESETS,
	normalizeHexColor,
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
				choices: rfChannelChoices,
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
			{
				type: 'checkbox',
				label: 'Require Confirmation',
				id: 'requireConfirmation',
				default: false,
				tooltip:
					'This will require a double press of the button to confirm the action. It will timeout after 5 seconds if not confirmed.',
			},
		],
		description: 'Set the RF Channel',
		callback: async (action) => {
			if (action.options.requireConfirmation) {
				const key = self.confirmationKey('setRfChannelState', {
					rfChannel: action.options.rfChannel,
					state: action.options.state,
				})
				if (!self.confirmAction(key)) return
			}
			if (!self.api) return
			await self.api.setRfChannel(action.options.rfChannel as string, {
				rfChannelId: action.options.rfChannel as number,
				rfState: action.options.state as RfState,
			})
		},
	}

	actions['setRfChannelStartupState'] = {
		name: 'RF - Startup State',
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: rfChannelChoices,
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
			await self.api.setRfChannel(action.options.rfChannel as string, {
				rfChannelId: action.options.rfChannel as number,
				rfStateOnStartup: action.options.state as RfStateStartup,
			})
		},
	}

	actions['rfTxPower'] = {
		name: 'RF - TX Power',
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: rfChannelChoices,
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
			await self.api.setRfChannel(action.options.rfChannel as string, {
				rfChannelId: action.options.rfChannel as number,
				txPower: action.options.txPower as TxPower,
			})
		},
	}

	actions['rfBandwidthMode'] = {
		name: 'RF - Bandwidth Mode',
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: rfChannelChoices,
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
			await self.api.setRfChannel(action.options.rfChannel as string, {
				rfChannelId: action.options.rfChannel as number,
				bandwidthMode: action.options.bandwidthMode as BandwidthMode,
			})
		},
	}

	actions['rfFrequency'] = {
		name: 'RF - Frequency',
		options: [
			{
				type: 'dropdown',
				label: 'RF Channel',
				choices: rfChannelChoices,
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
			{
				type: 'checkbox',
				label: 'Require Confirmation',
				id: 'requireConfirmation',
				default: false,
				tooltip:
					'This will require a double press of the button to confirm the action. It will timeout after 5 seconds if not confirmed.',
			},
		],
		description: 'Set the RF Channel Frequency',
		callback: async (action) => {
			if (!self.api) return
			if (action.options.requireConfirmation) {
				const key = self.confirmationKey('rfFrequency', {
					rfChannel: action.options.rfChannel,
					frequency: action.options.frequency,
				})
				if (!self.confirmAction(key)) return
			}
			await self.api.setRfChannel(action.options.rfChannel as string, {
				rfChannelId: action.options.rfChannel as number,
				frequency: Number(action.options.frequency) * 1000,
			})
		},
	}

	actions['setAudioInputInterface'] = {
		name: 'Audio Input - Interface',
		options: [
			{
				type: 'multidropdown',
				label: 'Audio Input',
				choices: Array.from(self.state.audioInputs.values()).map((i) => ({
					id: i.inputId,
					label: i.name || `Input ${i.inputId + 1}`,
				})),
				default: [0],
				id: 'inputId',
			},
			{
				type: 'dropdown',
				label: 'Interface',
				choices: [...getChoicesFromEnum(InputSource), { id: 'passthrough', label: 'Passthrough' }],
				default: InputSource.Dante,
				id: 'interface',
			},
			{
				type: 'dropdown',
				label: 'Mode',
				choices: [
					{ id: 'On', label: 'On' },
					{ id: 'Toggle', label: 'Toggle' },
				],
				default: 'On',
				id: 'mode',
			},
			{
				type: 'dropdown',
				label: 'Toggle Interface',
				choices: getChoicesFromEnum(InputSource),
				default: InputSource.Dante,
				id: 'toggleInterface',
				isVisibleExpression: '$(options:mode) === "Toggle"',
				tooltip: 'The secondary interface that will be moved to when the Toggle mode is selected.',
			},
			{
				type: 'checkbox',
				label: 'Require Confirmation',
				id: 'requireConfirmation',
				default: false,
				tooltip:
					'This will require a double press of the button to confirm the action. It will timeout after 5 seconds if not confirmed.',
			},
		],
		description: 'Set the audio input interface (Dante, MADI 1, MADI 2).',
		callback: async (action) => {
			if (action.options.interface === 'passthrough') return
			if (!self.api) return
			const iface = action.options.interface as InputSource
			const mode = action.options.mode as 'On' | 'Toggle'
			if (action.options.requireConfirmation) {
				const key = self.confirmationKey('setAudioInputInterface', {
					inputId: action.options.inputId,
					interface: action.options.interface,
					mode: action.options.mode,
				})
				if (!self.confirmAction(key)) return
			}
			for (const inputId of action.options.inputId as number[]) {
				const current = self.state.audioInputs.get(inputId)
				let nextSource: InputSource | undefined
				if (current?.iemAudiolinkId === -1) {
					continue
				}
				if (mode === 'Toggle') {
					nextSource =
						current?.inputSource === action.options.interface ? (action.options.toggleInterface as InputSource) : iface
				} else {
					nextSource = iface
				}
				await self.api.setAudioInput(inputId, { inputSource: nextSource })
			}
			self.checkFeedbacks('audioInputInterface')
		},
	}

	//DAD Actions
	actions['dadConnectedStateColor'] = {
		name: 'DAD - LED Colors',
		options: [
			{
				type: 'dropdown',
				label: 'DAD',
				choices: getChoicesFromEnum(AntennaPortId),
				default: AntennaPortId.A,
				id: 'dad',
			},
			{
				type: 'colorpicker',
				label: 'RF Active Color',
				id: 'rfActive',
				default: DEFAULT_LED_COLORS.rfActive!,
				returnType: 'string',
				presetColors: [...LED_COLOR_PRESETS],
			},
			{
				type: 'colorpicker',
				label: 'RF Muted Color',
				id: 'rfMuted',
				default: DEFAULT_LED_COLORS.rfMuted!,
				returnType: 'string',
				presetColors: [...LED_COLOR_PRESETS],
			},
		],
		description: 'Set custom LED colors for a DAD antenna',
		callback: async (action) => {
			if (!self.api) return
			await self.api.setAntenna(action.options.dad as AntennaPortId, {
				antennaPortId: action.options.dad as AntennaPortId,
				ledColors: {
					rfActive: normalizeHexColor(action.options.rfActive),
					rfMuted: normalizeHexColor(action.options.rfMuted),
				},
			})
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
			await self.api.setAntenna(action.options.dad as AntennaPortId, {
				antennaPortId: action.options.dad as AntennaPortId,
				identify: action.options.identify === 'true',
			})
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
				choices: [
					{ label: 'RF Channel 1', id: RFChannels['RF Channel 1'] },
					{ label: 'RF Channel 2', id: RFChannels['RF Channel 2'] },
					{ label: 'Scan', id: RFChannels.Scan },
				],
				default: RFChannels['RF Channel 1'],
				id: 'rfChannel',
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
			{
				type: 'checkbox',
				label: 'Require Confirmation',
				id: 'requireConfirmation',
				default: false,
				tooltip:
					'This will require a double press of the button to confirm the action. It will timeout after 5 seconds if not confirmed.',
			},
		],
		description: 'Set the DAD RF Channel',
		callback: async (action) => {
			if (!self.api) return
			const mode = action.options.mode as 'On' | 'Off' | 'Toggle'
			if (action.options.requireConfirmation) {
				const key = self.confirmationKey('dadRfBinding', {
					dad: action.options.dad,
					rfChannel: action.options.rfChannel,
				})
				if (!self.confirmAction(key)) return
			}
			let newBinding: RFChannels | undefined
			if (mode === 'Toggle') {
				const current = self.state.antennas.get(action.options.dad as AntennaPortId)?.bindings[0].binding
				newBinding = current === action.options.rfChannel ? RFChannels.Off : (action.options.rfChannel as RFChannels)
			} else if (mode === 'On') {
				newBinding = action.options.rfChannel as RFChannels
			} else if (mode === 'Off') {
				newBinding = RFChannels.Off
			}
			if (newBinding === undefined) return
			await self.api.setAntenna(
				action.options.dad as AntennaPortId,
				{
					antennaPortId: action.options.dad as AntennaPortId,
					bindings: [
						{
							subAntennaId: 0,
							binding: newBinding,
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
				choices: [{ label: 'Off', id: -1 }, ...rfChannelChoices],
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
			await self.api.setMobileDevice(device.mtUid, { rfChannelId })
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
			})
		},
	}

	/* actions['mobileDeviceSleep'] = {
		name: 'Mobile Device - Sleep',
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
				label: 'Sleep',
				choices: [
					{ id: 'true', label: 'Sleep' },
					{ id: 'false', label: 'Wake' },
				],
				default: 'true',
				id: 'sleep',
			},
		],
		description: 'Set Sleep state for a Mobile Device',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDevice(device.mtUid, {
				sleep: action.options.sleep === 'true',
			})
		},
	} */

	actions['mobileDeviceCommandBehavior'] = {
		name: 'Mobile Device - Command Behavior',
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
				label: 'Command Behavior',
				choices: getChoicesFromEnum(CommandBehavior),
				default: CommandBehavior.Disabled,
				id: 'commandBehavior',
			},
		],
		description: 'Set Command Behavior for a Mobile Device',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDevice(device.mtUid, {
				commandBehavior: action.options.commandBehavior as CommandBehavior,
			})
		},
	}

	actions['mobileDeviceConnectedStateColor'] = {
		name: 'Mobile Device - Connected State LED Color',
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
				type: 'colorpicker',
				label: 'Connected State Color',
				id: 'connectedStateColor',
				default: DEFAULT_CONNECTED_STATE_COLOR,
				returnType: 'string',
				presetColors: [...LED_COLOR_PRESETS],
			},
		],
		description: 'Set the Connected State LED color for a Mobile Device',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDevice(device.mtUid, {
				connectedStateColor: normalizeHexColor(action.options.connectedStateColor),
			})
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
				await self.api.setMobileDevice(device.mtUid, { headphoneVolume: volume })
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
				await self.api.setMobileDevice(device.mtUid, { headphoneBalance: balance })
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
				default: '1',
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
				await self.api.setMobileDevice(device.mtUid, { micPreampGain: gain })
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

			await self.api.setMobileDevice(device.mtUid, { micLowCutHz: frequency })
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
			})
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
			})
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
			})
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
			const rawName = await context.parseVariablesInString(action.options.name as string)
			const sanitizedName = sanitizeMobileDeviceName(rawName)
			await self.api.setMobileDevice(device.mtUid, {
				name: sanitizedName,
			})
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
			await self.api.removeIemAudioLinkFromDevice(device.mtUid)
		},
	}

	actions['setMobileDeviceIemAudioLinkMode'] = {
		name: 'Mobile Device - Set IEM Audio Link Mode',
		description: 'Set the mode of an active IEM audio link on an SEK.',
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
				label: 'Link Mode',
				id: 'modeId',
				choices: getChoicesFromEnum(IemAudiolinkMode),
				default: IemAudiolinkMode['LIVE (Stereo)'],
			},
		],
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDeviceAudioLinkMode(device.mtUid, 'iem', Number(action.options.modeId))
		},
	}

	actions['setMobileDeviceMicAudioLinkMode'] = {
		name: 'Mobile Device - Set Mic Audio Link Mode',
		description: 'Set the mode of an active Mic audio link on a mobile device.',
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
				label: 'Link Mode',
				id: 'modeId',
				choices: getChoicesFromEnum(MicAudiolinkMode),
				default: MicAudiolinkMode['LIVE (Mono)'],
			},
		],
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			await self.api.setMobileDeviceAudioLinkMode(device.mtUid, 'mic', Number(action.options.modeId))
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
			await self.api.removeMobileDeviceFromOutput(outputId)
		},
	}

	actions['instrumentSwitchMobileDeviceToOutput'] = {
		name: 'Audio I/O - Instrument Switch Mode',
		description: 'Route a Mobile Device to an Audio Output, with controls over the routing behavior and link mode.',
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
				label: 'Behavior',
				id: 'behavior',
				default: 'toggle',
				choices: [
					{ id: 'toggle', label: 'Toggle' },
					{ id: 'on', label: 'Always On' },
					{ id: 'off', label: 'Always Off' },
				],
			},
			{
				type: 'dropdown',
				label: 'Link Mode',
				choices: getChoicesFromEnum(MicAudiolinkMode),
				default: MicAudiolinkMode['LIVE (Mono)'],
				id: 'modeId',
				tooltip:
					'Fallback mode used when "Preserve Output Link Mode" is disabled, or when the output has no existing link to preserve.',
			},
			{
				type: 'checkbox',
				label: 'Preserve Output Link Mode',
				default: true,
				id: 'useExisting',
				tooltip: 'When enabled and the output already has a link from another device, the link mode is preserved.',
			},
		],
		callback: async (action, context) => {
			const api = self.api
			if (!api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) return
			const outputId = Number(action.options.outputId)
			const behavior = (action.options.behavior as string | undefined) ?? 'toggle'
			const defaultModeId = Number(action.options.modeId)
			const useExisting = Boolean(action.options.useExisting)

			await api.instrumentSwitchMobileDeviceToOutput(
				device.mtUid,
				outputId,
				behavior as 'toggle' | 'on' | 'off',
				defaultModeId,
				useExisting,
			)
		},
	}

	actions['setAudioOutputInterface'] = {
		name: 'Audio Output - Interface',
		options: [
			{
				type: 'multidropdown',
				label: 'Audio Output',
				choices: Array.from(self.state.audioOutputs.values()).map((o) => ({
					id: o.outputId,
					label: `Output ${o.outputId + 1}`,
				})),
				default: [0],
				id: 'outputId',
			},
			{
				type: 'dropdown',
				label: 'Interface',
				choices: [...audioOutputChannelChoices],
				default: 'commandModeAudioNetwork',
				id: 'interface',
			},
			{
				type: 'dropdown',
				label: 'Command Mode',
				choices: [...audioOutputCommandContextChoices],
				default: 'disabled',
				id: 'context',
				tooltip:
					'Which Command Mode to change the routing setting for: disabled (On/Off) or enabled (On/Off/Mute/Talk).',
			},
			{
				type: 'dropdown',
				label: 'Mode',
				choices: [{ id: 'Toggle', label: 'Toggle' }, ...audioOutputStateChoices],
				default: 'On',
				id: 'mode',
				tooltip: 'Mute/Talk only apply if the Command Mode is set to "Enabled".',
			},
			{
				type: 'checkbox',
				label: 'Require Confirmation',
				id: 'requireConfirmation',
				default: false,
				tooltip:
					'This will require a double press of the button to confirm the action. It will timeout after 5 seconds if not confirmed.',
			},
		],
		description: 'Set the interface mode (Dante, MADI 1, MADI 2) for one or more audio outputs.',
		callback: async (action) => {
			if (!self.api) return
			const rawOutputIds = action.options.outputId
			const outputIds = Array.isArray(rawOutputIds)
				? (rawOutputIds as number[]).map(Number)
				: rawOutputIds !== undefined && rawOutputIds !== null && rawOutputIds !== ''
					? [Number(rawOutputIds)]
					: []
			const iface = action.options.interface as AudioOutputInterfaceId
			const context = (action.options.context as AudioOutputCommandContext) ?? 'disabled'
			const modeOption = action.options.mode as 'On' | 'Off' | 'Toggle' | 'Mute' | 'Talk'
			// Mute/Talk are only valid for the enabled mode.
			if (context === 'disabled' && (modeOption === 'Mute' || modeOption === 'Talk')) {
				self.log('warn', 'Mute/Talk are only valid when Command Mode is enabled.')
				return
			}
			if (action.options.requireConfirmation) {
				const key = self.confirmationKey('setAudioOutputInterface', {
					outputId: action.options.outputId,
					interface: action.options.interface,
					context: action.options.context,
					mode: action.options.mode,
				})
				if (!self.confirmAction(key)) return
			}
			const prop = audioOutputInterfaceProps[iface][context]
			const disabledProps = audioOutputChannelChoices.map((c) => audioOutputInterfaceProps[c.id].disabled)
			for (const outputId of outputIds) {
				let mode: 'On' | 'Off' | 'Mute' | 'Talk' = modeOption === 'Toggle' ? 'On' : modeOption
				const current = self.state.audioOutputs.get(outputId)
				if (current?.micAudiolinkId === -1) continue
				if (modeOption === 'Toggle') {
					mode = current?.[prop] === 'On' ? 'Off' : 'On'
				}
				if (context === 'disabled' && mode === 'Off') {
					const onCount = disabledProps.filter((p) => current?.[p] === 'On').length
					if (current?.[prop] === 'On' && onCount === 1) continue
				}
				await self.api.setAudioOutput(outputId, { [prop]: mode })
			}
			self.checkFeedbacks('audioOutputInterface')
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
			{
				type: 'checkbox',
				label: 'Require Confirmation',
				id: 'requireConfirmation',
				default: false,
				tooltip:
					'This will require a double press of the button to confirm the action. It will timeout after 5 seconds if not confirmed.',
			},
		],
		description:
			'Copy all shared settings from one Mobile Device to another, including copying the IEM link and moving the mic links, if present.',
		callback: async (action, context) => {
			if (!self.api) return
			if (action.options.requireConfirmation) {
				const key = self.confirmationKey('copyAllMobileDeviceSettings', {
					sourceSerial: action.options.sourceSerial,
					targetSerial: action.options.targetSerial,
				})
				if (!self.confirmAction(key)) return
			}
			const sourceSerial = await context.parseVariablesInString(action.options.sourceSerial as string)
			const targetSerial = await context.parseVariablesInString(action.options.targetSerial as string)
			const sourceDevice = getDeviceBySerial(self.state, sourceSerial)
			const targetDevice = getDeviceBySerial(self.state, targetSerial)
			if (!sourceDevice || !targetDevice) return

			await self.api.copyMobileDeviceSettings(sourceDevice.mtUid, targetDevice.mtUid)
		},
	}

	actions['setMobileDeviceSettingsJson'] = {
		name: 'Mobile Device - Set Settings From JSON',
		options: [
			{
				type: 'dropdown',
				label: 'Target Mobile Device',
				id: 'serial',
				default: mobileDeviceChoices.length > 0 ? mobileDeviceChoices[0].id : '',
				choices: mobileDeviceChoices,
				allowCustom: true,
			},
			{
				type: 'textinput',
				label: 'Settings JSON',
				id: 'json',
				default: '',
				useVariables: true,
				tooltip:
					'Paste the value of another mobile device’s "Settings (JSON)" variable, e.g. $(spectera:SEK_1234567890_settings_json).',
			},
			{
				type: 'checkbox',
				label: 'Require Confirmation',
				id: 'requireConfirmation',
				default: false,
				tooltip:
					'This will require a double press of the button to confirm the action. It will timeout after 5 seconds if not confirmed.',
			},
		],
		description:
			'Apply a set of mobile-device settings from a JSON string (typically a device’s Settings (JSON) variable).',
		callback: async (action, context) => {
			if (!self.api) return
			const serial = await context.parseVariablesInString(action.options.serial as string)
			const device = getDeviceBySerial(self.state, serial)
			if (!device) {
				self.log('warn', `Set Settings From JSON: Mobile Device "${serial}" not found`)
				return
			}

			const rawJson = await context.parseVariablesInString(action.options.json as string)
			const { payload, warnings, error } = parseMobileDeviceSettingsJson(rawJson, device)

			if (error) {
				self.log('warn', `Set Settings From JSON: ${error}`)
				return
			}
			for (const warning of warnings) {
				self.log('info', `Set Settings From JSON (${device.name}): ${warning}`)
			}
			const appliedKeys = Object.keys(payload)
			if (appliedKeys.length === 0) {
				self.log('warn', `Set Settings From JSON (${device.name}): no valid settings to apply`)
				return
			}

			if (action.options.requireConfirmation) {
				const key = self.confirmationKey('setMobileDeviceSettingsJson', { serial })
				if (!self.confirmAction(key)) return
			}

			await self.api.setMobileDevice(device.mtUid, payload)
			self.log('debug', `Set Settings From JSON (${device.name}): applied ${appliedKeys.join(', ')}`)
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
