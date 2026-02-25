import { CompanionPresetDefinitions } from '@companion-module/base'
import { SpecteraInstance } from './main.js'
import { Color } from './utils.js'
import {
	RFChannels,
	AntennaPortId,
	BaseStationStatus,
	DeviceStatus,
	RfState,
	MtType,
	InterfaceInputStatus,
	MicAudiolinkMode,
	InputSource,
} from './types.js'

export function UpdatePresets(self: SpecteraInstance): void {
	const presets: CompanionPresetDefinitions = {}

	//RF Channels
	for (const channelName of Object.keys(RFChannels)) {
		const channelId = RFChannels[channelName as keyof typeof RFChannels]
		if (channelId === RFChannels.Off) continue

		const channelIndex = channelId === RFChannels['RF Channel 1'] ? 0 : 1
		const channelLabel = channelName

		presets[`rf${channelIndex}Header`] = {
			type: 'text',
			category: 'RF Configuration',
			name: `${channelLabel}`,
			text: '',
		}

		presets[`rf${channelIndex}StateInfo`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `${channelLabel} State Info`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${channelLabel}\\nSTATE\\n$(spectera:rf_channel_${channelIndex + 1}_state)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'rfState',
					options: {
						rfChannel: channelIndex,
						state: RfState.Active,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
				{
					feedbackId: 'rfState',
					options: {
						rfChannel: channelIndex,
						state: RfState.Muted,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}

		presets[`rf${channelIndex}FrequencyInfo`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `${channelLabel} Frequency`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${channelLabel}\\nFREQ\\n$(spectera:rf_channel_${channelIndex + 1}_frequency) MHz`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`rf${channelIndex}TxPowerInfo`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `${channelLabel} TX Power`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${channelLabel}\\nTX POWER\\n$(spectera:rf_channel_${channelIndex + 1}_tx_power) mW EIRP`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`rf${channelIndex}RestrictionViolationInfo`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `${channelLabel} Restriction Violation`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${channelLabel}\\nViolation\\n$(spectera:rf_channel_${channelIndex + 1}_rf_restriction_violation)`,
				size: 10,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'rfRestrictionViolation',
					options: {
						rfChannel: channelIndex,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}

		presets[`rf${channelIndex}SetActive`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `${channelLabel} ACTIVE`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${channelLabel}\\nACTIVE`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'setRfChannelState',
							options: {
								rfChannel: channelIndex,
								state: RfState.Active,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'rfState',
					options: {
						rfChannel: channelIndex,
						state: RfState.Active,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
			],
		}

		presets[`rf${channelIndex}SetMuted`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `${channelLabel} MUTE`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${channelLabel}\\nMUTE`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'setRfChannelState',
							options: {
								rfChannel: channelIndex,
								state: RfState.Muted,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'rfState',
					options: {
						rfChannel: channelIndex,
						state: RfState.Muted,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}
	}

	//DADs
	for (const dad of Object.keys(AntennaPortId)) {
		const port = dad.toLowerCase()
		presets[`dad${port}Header`] = {
			type: 'text',
			category: 'RF Configuration',
			name: `DAD ${dad}`,
			text: '',
		}
		presets[`dad${port}State`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} State`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\n\\n$(spectera:dad_${port}_state)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				...Object.values(DeviceStatus).map((state) => {
					return {
						feedbackId: 'dadState',
						options: {
							dad: port,
							state: state,
						},
						style: {
							bgcolor: state === DeviceStatus.Initialized ? Color.SpecteraGreen : Color.SpecteraRed,
						},
					}
				}),
			],
		}
		presets[`dad${port}Identify`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Identify`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\nIDENTIFY`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'dadIdentify',
							options: {
								dad: port,
								identify: 'true',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'dadIdenitify',
					options: {
						dad: port,
					},
					style: {
						bgcolor: Color.SpecteraBlue,
					},
				},
			],
		}
		presets[`dad${port}InterferencePower`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Interference Noise Level`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\nN+I\\n$(spectera:dad_${port}_noise_level) dBm`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'dadInterferencePower',
					isInverted: true,
					options: {
						dad: port,
						interferencePower: -100,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -90,
					},
					style: {
						bgcolor: Color.SpecteraOrange,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -80,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}
		presets[`dad${port}Bindings`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Bindings`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\n\\n$(spectera:dad_${port}_bindings)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'dadBindings',
					options: {
						dad: port,
						bindings: RFChannels['Off'],
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
				{
					feedbackId: 'dadBindings',
					isInverted: true,
					options: {
						dad: port,
						bindings: RFChannels['Off'],
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
			],
		}
		presets[`dad${port}BindingSetOff`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Binding Set`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\nto\\nOFF`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'dadRfBinding',
							options: {
								dad: port,
								rfChannel: RFChannels['Off'],
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'dadBindings',
					options: {
						dad: port,
						bindings: RFChannels['Off'],
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}
		presets[`dad${port}BindingSetRF1`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Binding Set`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\nto\\nRF 1`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'dadRfBinding',
							options: {
								dad: port,
								rfChannel: RFChannels['RF Channel 1'],
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'dadBindings',
					options: {
						dad: port,
						bindings: RFChannels['RF Channel 1'],
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
			],
		}
		presets[`dad${port}BindingSetRF2`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Binding Set`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\nto\\nRF 2`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'dadRfBinding',
							options: {
								dad: port,
								rfChannel: RFChannels['RF Channel 2'],
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'dadBindings',
					options: {
						dad: port,
						bindings: RFChannels['RF Channel 2'],
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
			],
		}
	}

	//Audio Inputs
	presets[`audioInputCurrentSourceHeader`] = {
		type: 'text',
		category: 'Audio Inputs',
		name: `Audio Inputs - Current Source`,
		text: '',
	}
	for (const input of self.state.audioInputs.values()) {
		presets[`audioInput${input.inputId}CurrentSource`] = {
			type: 'button',
			category: 'Audio Inputs',
			name: `${input.name || `Input ${input.inputId + 1}`} - Current Source`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${input.name || `IN ${input.inputId + 1}`}\\n$(spectera:audio_input_${input.inputId + 1}_source)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
	}
	presets[`audioInputCurrentDevices`] = {
		type: 'text',
		category: 'Audio Inputs',
		name: `Audio Inputs - Current Devices`,
		text: '',
	}
	for (const input of self.state.audioInputs.values()) {
		presets[`audioInput${input.inputId}CurrentDevices`] = {
			type: 'button',
			category: 'Audio Inputs',
			name: `${input.name || `Input ${input.inputId + 1}`} - Current Devices`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${input.name || `IN ${input.inputId + 1}`}\\n$(spectera:audio_input_${input.inputId + 1}_iem_link_devices)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
	}
	for (const input of self.state.audioInputs.values()) {
		presets[`audioInput${input.inputId}SourceHeader`] = {
			type: 'text',
			category: 'Audio Inputs',
			name: `${input.name || `Input ${input.inputId + 1}`} - Select Source`,
			text: '',
		}
		for (const source of [InputSource.Dante, InputSource['MADI 1'], InputSource['MADI 2']] as const) {
			const sourceLabel =
				source === InputSource.Dante ? 'Dante' : source === InputSource['MADI 1'] ? 'MADI 1' : 'MADI 2'
			presets[`audioInput${input.inputId}Source_${source}`] = {
				type: 'button',
				category: 'Audio Inputs',
				name: `${input.name || `Input ${input.inputId + 1}`} - ${sourceLabel}`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `${input.name || `IN ${input.inputId + 1}`}\\nto\\n${sourceLabel}`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'setAudioInputSource',
								options: {
									inputId: input.inputId,
									source,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'audioInputSource',
						options: {
							inputId: input.inputId,
							source,
						},
						style: {
							bgcolor: Color.SpecteraBlue,
						},
					},
				],
			}
		}
	}

	//Audio Outputs
	presets[`audioOutputCurrentSourceHeader`] = {
		type: 'text',
		category: 'Audio Outputs',
		name: `Audio Outputs - Current Source`,
		text: '',
	}
	for (const output of self.state.audioOutputs.values()) {
		presets[`audioOutput${output.outputId}CurrentSource`] = {
			type: 'button',
			category: 'Audio Outputs',
			name: `Output ${output.outputId + 1} - Current Source`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `OUT ${output.outputId + 1}\\n$(spectera:audio_output_${output.outputId + 1}_source)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
	}
	presets[`audioOutputCurrentChannelHeader`] = {
		type: 'text',
		category: 'Audio Outputs',
		name: `Audio Outputs - Current Destinations`,
		text: '',
	}
	for (const output of self.state.audioOutputs.values()) {
		presets[`audioOutput${output.outputId}CurrentChannel`] = {
			type: 'button',
			category: 'Audio Outputs',
			name: `Output ${output.outputId + 1} - Current Destinations`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `OUT ${output.outputId + 1}\\n$(spectera:audio_output_${output.outputId + 1}_destinations)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
	}
	for (const output of self.state.audioOutputs.values()) {
		presets[`audioOutput${output.outputId}SourceHeader`] = {
			type: 'text',
			category: 'Audio Outputs',
			name: `Output ${output.outputId + 1} - Select Destination`,
			text: '',
		}
		const audioOutputChannelChoices = [
			{ id: 'commandModeAudioNetwork', label: 'Dante' },
			{ id: 'commandModeMadi1', label: 'MADI 1' },
			{ id: 'commandModeMadi2', label: 'MADI 2' },
		] as const
		for (const channel of audioOutputChannelChoices) {
			presets[`audioOutput${output.outputId}Destination_${channel.id}`] = {
				type: 'button',
				category: 'Audio Outputs',
				name: `Output ${output.outputId + 1} - ${channel.label}`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `OUT ${output.outputId + 1}\\nto\\n${channel.label}`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'setAudioOutputChannel',
								options: {
									outputId: output.outputId,
									channel: channel.id,
									mode: 'Toggle',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'audioOutputChannel',
						options: {
							outputId: output.outputId,
							channel: channel.id,
							state: 'On',
						},
						style: {
							bgcolor: Color.SpecteraBlue,
						},
					},
				],
			}
		}
	}

	//Mobile Devices
	const mobileDevices = [...self.state.mobileDevices.values()]
	mobileDevices.sort((a, b) => a.name.localeCompare(b.name))

	for (const device of mobileDevices) {
		const type = device.type
		const serial = device.serial
		const deviceVariableId = `${type}_${serial}`
		const category = device.type === MtType.SEK ? 'SEK' : 'SKM'

		presets[`${deviceVariableId}_MicLinkMove_Header`] = {
			type: 'text',
			category: `Instrument Switch Mode`,
			name: `${device.name} (SN ${serial})`,
			text: '',
		}

		for (const output of self.state.audioOutputs.values()) {
			presets[`${deviceVariableId}_MicLinkMove_Source_${output.outputId}`] = {
				type: 'button',
				category: `Instrument Switch Mode`,
				name: `${device.name} Source`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\nto\\nOUT ${output.outputId + 1}`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'routeMobileDeviceToAudioOutput',
								options: {
									serial: device.serial,
									outputId: output.outputId,
									modeId: MicAudiolinkMode['LIVE (Mono)'],
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'mobileDeviceOutputLinked',
						options: {
							serial: device.serial,
							outputId: output.outputId,
						},
						style: {
							bgcolor: Color.SpecteraGreen,
						},
					},
				],
			}
		}

		presets[`${deviceVariableId}_Header`] = {
			type: 'text',
			category: `${category}s`,
			name: `${device.name} (SN ${serial})`,
			text: '',
		}

		presets[`${deviceVariableId}_OverallStatus`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Overall Status`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\n$(spectera:${deviceVariableId}_state)\\nBAT: $(spectera:${deviceVariableId}_battery_level)%\\n$(spectera:${deviceVariableId}_headphone_plug_state)\\n$(spectera:${deviceVariableId}_headphone_volume)dB`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'mobileDeviceConnected',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
			],
		}

		presets[`${deviceVariableId}_Connection`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Connection`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nSTATE\\n\\n$(spectera:${deviceVariableId}_state)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'mobileDeviceConnected',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
			],
		}

		presets[`${deviceVariableId}_Battery`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Battery`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nBATTERY\\n\\n$(spectera:${deviceVariableId}_battery_level) %\\n$(spectera:${deviceVariableId}_battery_runtime)`,
				size: 10,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'mobileDeviceBatteryLow',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}

		presets[`${deviceVariableId}_LastConnected`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Last Connected`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nLAST SEEN\\n\\n$(spectera:${deviceVariableId}_last_connected)`,
				size: 10,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`${deviceVariableId}_Identify`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Identify`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nIDENTIFY`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'mobileDeviceIdentify',
							options: {
								serial: device.serial,
								identify: 'true',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'mobileDeviceIdentify',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.SpecteraBlue,
					},
				},
			],
		}

		presets[`${deviceVariableId}_ReverseIdentify`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Reverse Identify`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nREVERSE\\nIDENTIFY`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'mobileDeviceReverseIdentify',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.SpecteraBlue,
					},
				},
			],
		}

		presets[`${deviceVariableId}_Interference`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Interference`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nIF\\n\\n$(spectera:${deviceVariableId}_interference)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'mobileDeviceInterference',
					options: {
						serial: device.serial,
						severity: 'High',
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}

		if (device.type === MtType.SEK) {
			presets[`${deviceVariableId}_HeadphoneVolumeInfo`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} Headphone Vol`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\nPHONES\\n$(spectera:${deviceVariableId}_headphone_plug_state)\\n$(spectera:${deviceVariableId}_headphone_volume)dB`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [],
						up: [],
					},
				],
				feedbacks: [],
			}

			presets[`${deviceVariableId}_HeadphoneVolumeUp`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} Phone Vol +1`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\nVOL +1`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'mobileDeviceHeadphoneVolume',
								options: {
									serial: device.serial,
									action: 'adjust',
									adjustment: '1',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}

			presets[`${deviceVariableId}_HeadphoneVolumeDown`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} Phone Vol -1`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\nVOL -1`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'mobileDeviceHeadphoneVolume',
								options: {
									serial: device.serial,
									action: 'adjust',
									adjustment: '-1',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}

			presets[`${deviceVariableId}_HeadphoneVolumeRotarty`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} Phone Vol Rotarty`,
				options: {
					rotaryActions: true,
				},
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\nVOL ROTARY`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [],
						up: [],
						rotate_left: [
							{
								actionId: 'mobileDeviceHeadphoneVolume',
								options: {
									serial: device.serial,
									action: 'adjust',
									adjustment: '-1',
								},
							},
						],
						rotate_right: [
							{
								actionId: 'mobileDeviceHeadphoneVolume',
								options: {
									serial: device.serial,
									action: 'adjust',
									adjustment: '1',
								},
							},
						],
					},
				],
				feedbacks: [],
			}

			presets[`${deviceVariableId}_EngineerModeStereoHeader`] = {
				type: 'text',
				category: `Engineer Mode`,
				name: `${device.name} (SN ${serial}) - Stereo`,
				text: '',
			}
			presets[`${deviceVariableId}_EngMode_remove`] = {
				type: 'button',
				category: `Engineer Mode`,
				name: `${device.name} Remove IEM Audio Link`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `REMOVE`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'removeIemAudioLink',
								options: {
									serial: device.serial,
								},
							},
							{
								actionId: 'mobileDeviceRename',
								options: {
									serial: device.serial,
									name: `${device.name}`,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
			const sortedInputs = [...self.state.audioInputs.values()].sort((a, b) => a.inputId - b.inputId)

			// Grouped Inputs (1+2, 3+4, etc.)
			// We iterate by 2 to get pairs
			for (let i = 0; i < sortedInputs.length; i += 2) {
				const input1 = sortedInputs[i]
				const input2 = sortedInputs[i + 1]

				// We only create a pair if there is a second input
				if (!input2) break

				const pairLabel = `IN ${input1.inputId + 1} + ${input2.inputId + 1}\\n$(spectera:audio_input_${input1.inputId + 1}_iem_link_primary_device)`
				const pairName = `${input1.name} + ${input2.name} Engineer Mode`

				presets[`${deviceVariableId}_EngMode_Pair_${input1.inputId}_${input2.inputId}`] = {
					type: 'button',
					category: `Engineer Mode`,
					name: pairName,
					style: {
						bgcolor: Color.Black,
						color: Color.White,
						text: pairLabel,
						size: 11,
						show_topbar: false,
					},
					steps: [
						{
							down: [
								{
									actionId: 'routeAudioInputToMobileDevice',
									options: {
										inputId: input1.inputId,
										serial: device.serial,
										modeId: 7, // LIVE (Stereo)
									},
								},
								{
									actionId: 'setAudioInputSource',
									options: {
										inputId: input1.inputId,
										source: InputSource.Dante,
									},
								},
								{
									actionId: 'mobileDeviceRename',
									options: {
										serial: device.serial,
										name: `ENG-$(spectera:audio_input_${input1.inputId + 1}_iem_link_primary_device)`,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'iemAudioInputLinked',
							options: {
								serial: device.serial,
								inputId: input1.inputId,
							},
							style: {
								bgcolor: Color.SpecteraBlue,
							},
						},
					],
				}
			}

			presets[`${deviceVariableId}_EngineerModeMonoHeader`] = {
				type: 'text',
				category: `Engineer Mode`,
				name: `${device.name} (SN ${serial}) - Mono`,
				text: '',
			}
			presets[`${deviceVariableId}_EngMode_Mono_remove`] = {
				type: 'button',
				category: `Engineer Mode`,
				name: `${device.name} Remove IEM Audio Link`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `REMOVE`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'removeIemAudioLink',
								options: {
									serial: device.serial,
								},
							},
							{
								actionId: 'mobileDeviceRename',
								options: {
									serial: device.serial,
									name: `${device.name}`,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}

			// Individual Inputs
			for (const input of sortedInputs) {
				presets[`${deviceVariableId}_EngMode_${input.inputId}`] = {
					type: 'button',
					category: `Engineer Mode`,
					name: `${input.name} Engineer Mode`,
					style: {
						bgcolor: Color.Black,
						color: Color.White,
						text: `IN ${input.inputId + 1}\\n$(spectera:audio_input_${input.inputId + 1}_iem_link_primary_device)`,
						size: 11,
						show_topbar: false,
					},
					steps: [
						{
							down: [
								{
									actionId: 'routeAudioInputToMobileDevice',
									options: {
										inputId: input.inputId,
										serial: device.serial,
										modeId: 4, // LIVE (Mono)
									},
								},
								{
									actionId: 'setAudioInputSource',
									options: {
										inputId: input.inputId,
										source: InputSource.Dante,
									},
								},
								{
									actionId: 'mobileDeviceRename',
									options: {
										serial: device.serial,
										name: `ENG-$(spectera:audio_input_${input.inputId + 1}_iem_link_primary_device)`,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'iemAudioInputLinked',
							options: {
								serial: device.serial,
								inputId: input.inputId,
							},
							style: {
								bgcolor: Color.SpecteraBlue,
							},
						},
					],
				}
			}

			presets[`${deviceVariableId}_CopySettingsHeader`] = {
				type: 'text',
				category: `Backup Mode`,
				name: `${device.name} (SN ${serial}) - Backup Mode`,
				text: '',
			}
			for (const copyDevice of mobileDevices) {
				if (copyDevice.mtUid === device.mtUid) {
					continue
				}
				presets[`${deviceVariableId}_BackupMode_${copyDevice.mtUid}`] = {
					type: 'button',
					category: `Backup Mode`,
					name: `${copyDevice.name} Backup Mode`,
					style: {
						bgcolor: Color.Black,
						color: Color.White,
						text: `${copyDevice.name}\\nOVERRIDE`,
						size: 11,
						show_topbar: false,
					},
					steps: [
						{
							down: [
								{
									actionId: 'copyAllMobileDeviceSettings',
									options: {
										sourceSerial: copyDevice.serial,
										targetSerial: device.serial,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [],
				}
			}
		}

		presets[`${deviceVariableId}_GainInfo`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Gain`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nPREAMP GAIN\\n$(spectera:${deviceVariableId}_mic_preamp_gain) dB`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`${deviceVariableId}_GainUp`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Gain +3`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nGAIN +3`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'mobileDeviceMicPreampGain',
							options: {
								serial: device.serial,
								action: 'adjust',
								adjustment: '3',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`${deviceVariableId}_GainDown`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Gain -3`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nGAIN -3`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'mobileDeviceMicPreampGain',
							options: {
								serial: device.serial,
								action: 'adjust',
								adjustment: '-3',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`${deviceVariableId}_HeadphoneGainRotarty`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Phone Gain Rotarty`,
			options: {
				rotaryActions: true,
			},
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nGAIN ROTARY`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
					rotate_left: [
						{
							actionId: 'mobileDeviceMicPreampGain',
							options: {
								serial: device.serial,
								action: 'adjust',
								adjustment: '-1',
							},
						},
					],
					rotate_right: [
						{
							actionId: 'mobileDeviceMicPreampGain',
							options: {
								serial: device.serial,
								action: 'adjust',
								adjustment: '1',
							},
						},
					],
				},
			],
			feedbacks: [],
		}
	}

	//Base Station
	presets['baseStationHeader'] = {
		type: 'text',
		category: 'Base Station',
		name: 'Base Station Status',
		text: '',
	}
	presets['baseStationState'] = {
		type: 'button',
		category: 'Base Station',
		name: 'Base Station State',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'SPECTERA STATUS\\n\\n$(spectera:base_station_state)',
			size: 12,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			...Object.values(BaseStationStatus).map((state) => {
				return {
					feedbackId: 'baseStationState',
					options: {
						state: state,
					},
					style: {
						bgcolor: state === BaseStationStatus.Normal ? Color.SpecteraGreen : Color.SpecteraRed,
					},
				}
			}),
		],
	}
	presets['baseStationWarnings'] = {
		type: 'button',
		category: 'Base Station',
		name: 'Base Station Warnings',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'SPECTERA WARNINGS\\n\\n$(spectera:base_station_warnings)',
			size: 12,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'baseStationWarnings',
				options: {},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
		],
	}
	presets['baseStationPsu1'] = {
		type: 'button',
		category: 'Base Station',
		name: 'Base Station PSU 1',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'SPECTERA PSU 1\n\n$(spectera:health_psu_1_state)',
			size: 11,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'baseStationPsu',
				isInverted: true,
				options: {
					psu: 'psu1',
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
			{
				feedbackId: 'baseStationPsu',
				options: {
					psu: 'psu1',
				},
				style: {
					bgcolor: Color.SpecteraGreen,
				},
			},
		],
	}
	presets['baseStationPsu2'] = {
		type: 'button',
		category: 'Base Station',
		name: 'Base Station PSU 2',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'SPECTERA PSU 2\n\n$(spectera:health_psu_2_state)',
			size: 11,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'baseStationPsu',
				isInverted: true,
				options: {
					psu: 'psu2',
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
			{
				feedbackId: 'baseStationPsu',
				options: {
					psu: 'psu2',
				},
				style: {
					bgcolor: Color.SpecteraGreen,
				},
			},
		],
	}

	presets['baseStationTemp'] = {
		type: 'button',
		category: 'Base Station',
		name: 'Base Station Temperature',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'TEMP\\n$(spectera:health_temp_state)',
			size: 11,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [],
	}

	for (let i = 1; i <= 3; i++) {
		presets[`baseStationFan${i}`] = {
			type: 'button',
			category: 'Base Station',
			name: `Base Station Fan ${i}`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `FAN ${i}\\n$(spectera:health_fan_${i}_error)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [],
					up: [],
				},
			],
			feedbacks: [],
		}
	}
	// Audio Interfaces
	// Audio Network (Dante)
	presets['audioNetworkHeader'] = {
		type: 'text',
		category: 'Base Station',
		name: 'Audio Interfaces',
		text: '',
	}
	presets['audioNetworkStatus'] = {
		type: 'button',
		category: 'Base Station',
		name: 'Audio Network Status',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'DANTE I/O\\n\\n$(spectera:dante_status)\\n$(spectera:dante_sample_rate)Hz',
			size: 10,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'audioNetwork',
					status: InterfaceInputStatus.Locked,
				},
				style: {
					bgcolor: Color.SpecteraGreen,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'audioNetwork',
					status: InterfaceInputStatus.NoToggle,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'audioNetwork',
					status: InterfaceInputStatus.Unlocked,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
		],
	}

	// MADI 1
	presets['madi1InputStatus'] = {
		type: 'button',
		category: 'Base Station',
		name: 'MADI 1 Input Status',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'MADI 1 IN\\n\\n$(spectera:madi_1_input_status)\\n$(spectera:madi_1_input_sample_rate)Hz',
			size: 10,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi1In',
					status: InterfaceInputStatus.Locked,
				},
				style: {
					bgcolor: Color.SpecteraGreen,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi1In',
					status: InterfaceInputStatus.NoToggle,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi1In',
					status: InterfaceInputStatus.Unlocked,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
		],
	}
	presets['madi1OutputStatus'] = {
		type: 'button',
		category: 'Base Station',
		name: 'MADI 1 Output Status',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'MADI 1 OUT\\n\\n$(spectera:madi_1_output_clock_source_status)\\n$(spectera:madi_1_output_sample_rate)Hz',
			size: 10,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi1Out',
					status: InterfaceInputStatus.Locked,
				},
				style: {
					bgcolor: Color.SpecteraGreen,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi1Out',
					status: InterfaceInputStatus.NoToggle,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi1Out',
					status: InterfaceInputStatus.Unlocked,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
		],
	}

	// MADI 2
	presets['madi2InputStatus'] = {
		type: 'button',
		category: 'Base Station',
		name: 'MADI 2 Input Status',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'MADI 2 IN\\n\\n$(spectera:madi_2_input_status)\\n$(spectera:madi_2_input_sample_rate)Hz',
			size: 10,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi2In',
					status: InterfaceInputStatus.Locked,
				},
				style: {
					bgcolor: Color.SpecteraGreen,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi2In',
					status: InterfaceInputStatus.NoToggle,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi2In',
					status: InterfaceInputStatus.Unlocked,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
		],
	}
	presets['madi2OutputStatus'] = {
		type: 'button',
		category: 'Base Station',
		name: 'MADI 2 Output Status',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'MADI 2 OUT\\n\\n$(spectera:madi_2_output_clock_source_status)\\n$(spectera:madi_2_output_sample_rate)Hz',
			size: 10,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi2Out',
					status: InterfaceInputStatus.Locked,
				},
				style: {
					bgcolor: Color.SpecteraGreen,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi2Out',
					status: InterfaceInputStatus.NoToggle,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'madi2Out',
					status: InterfaceInputStatus.Unlocked,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
		],
	}

	// Wordclock
	presets['wordclockInputStatus'] = {
		type: 'button',
		category: 'Base Station',
		name: 'Wordclock Input Status',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'WC IN\\n\\n$(spectera:wordclock_input_status)\\n$(spectera:wordclock_input_sample_rate)Hz',
			size: 10,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'wordclockIn',
					status: InterfaceInputStatus.Locked,
				},
				style: {
					bgcolor: Color.SpecteraGreen,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'wordclockIn',
					status: InterfaceInputStatus.NoToggle,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'wordclockIn',
					status: InterfaceInputStatus.Unlocked,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
		],
	}
	presets['wordclockOutputStatus'] = {
		type: 'button',
		category: 'Base Station',
		name: 'Wordclock Output Status',
		style: {
			bgcolor: Color.Black,
			color: Color.White,
			text: 'WC OUT\\n\\n$(spectera:wordclock_output_clock_source_status)\\n$(spectera:wordclock_output_sample_rate)Hz',
			size: 10,
			show_topbar: false,
		},
		steps: [
			{
				down: [],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'wordclockOut',
					status: InterfaceInputStatus.Locked,
				},
				style: {
					bgcolor: Color.SpecteraGreen,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'wordclockOut',
					status: InterfaceInputStatus.NoToggle,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
			{
				feedbackId: 'audioInterfaceStatus',
				options: {
					interface: 'wordclockOut',
					status: InterfaceInputStatus.Unlocked,
				},
				style: {
					bgcolor: Color.SpecteraRed,
				},
			},
		],
	}

	self.setPresetDefinitions(presets)
}
