import { CompanionPresetDefinitions } from '@companion-module/base'
import { SpecteraInstance } from './main.js'
import { audioOutputChannelChoices, Color, STEREO_INPUT_OFFSET } from './utils.js'
import {
	RFChannels,
	AntennaPortId,
	BaseStationStatus,
	DeviceStatus,
	RfState,
	MtType,
	MobileDevice,
	SEKDevice,
	InterfaceInputStatus,
	MicAudiolinkMode,
	InputSource,
	MtState,
} from './types.js'

export function UpdatePresets(self: SpecteraInstance): void {
	const presets: CompanionPresetDefinitions = {}

	const rfChannelChoices = [
		{ label: 'RF Channel 1', id: 0 },
		{ label: 'RF Channel 2', id: 1 },
	]
	//RF Channels
	for (const channel of rfChannelChoices) {
		const channelIndex = channel.id
		const channelLabel = channel.label

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

		presets[`rf${channelIndex}BackupFrequency`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `${channelLabel} Backup Frequency`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${channelLabel}\\nBACKUP FREQ (Setup in Button)`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'rfFrequency',
							options: {
								rfChannel: channelIndex,
								frequency: '',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'rfFrequency',
					options: {
						rfChannel: channelIndex,
						frequency: '',
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
			],
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
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -99,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -86,
					},
					style: {
						bgcolor: Color.DarkGreen,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -80,
					},
					style: {
						bgcolor: Color.SpecteraOrange,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -70,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}
		presets[`dad${port}Frequency`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Frequency`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\n\\n$(spectera:dad_${port}_frequency) MHz`,
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
					feedbackId: 'dadState',
					options: {
						dad: port,
						state: DeviceStatus.Initialized,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
				{
					feedbackId: 'dadState',
					options: {
						dad: port,
						state: DeviceStatus.Unconnected,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
				{
					feedbackId: 'dadWarningPacketError',
					options: {
						dad: port,
					},
					style: {
						bgcolor: Color.SpecteraOrange,
					},
				},
			],
		}
		presets[`dad${port}MainInterferers`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Main Interferers`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\n$(spectera:dad_${port}_main_interferers)`,
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
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -99,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -86,
					},
					style: {
						bgcolor: Color.DarkGreen,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -80,
					},
					style: {
						bgcolor: Color.SpecteraOrange,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -70,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}
		presets[`dad${port}FrequencyNoise`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Frequency & Noise Level`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\n\\n$(spectera:dad_${port}_frequency) MHz\\n\\n$(spectera:dad_${port}_noise_level) dBm`,
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
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -99,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -86,
					},
					style: {
						bgcolor: Color.DarkGreen,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -80,
					},
					style: {
						bgcolor: Color.SpecteraOrange,
					},
				},
				{
					feedbackId: 'dadInterferencePower',
					options: {
						dad: port,
						interferencePower: -70,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
			],
		}
		presets[`dad${port}BindingSetOff`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} Binding Set OFF`,
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
			name: `DAD ${dad} Binding Set RF 1`,
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
			name: `DAD ${dad} Binding Set RF 2`,
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
		presets[`dad${port}BindingSetScan`] = {
			type: 'button',
			category: 'RF Configuration',
			name: `DAD ${dad} SCAN`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `DAD ${dad}\\nto\\nSCAN`,
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
								rfChannel: RFChannels['Scan'],
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
						bindings: RFChannels['Scan'],
					},
					style: {
						bgcolor: Color.SpecteraOrange,
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
	presets[`audioInputAllInputsSourceHeader`] = {
		type: 'text',
		category: 'Audio Inputs',
		name: `All Inputs - Select Source`,
		text: '',
	}
	for (const source of [InputSource.Dante, InputSource['MADI 1'], InputSource['MADI 2']] as const) {
		const sourceLabel = source === InputSource.Dante ? 'Dante' : source === InputSource['MADI 1'] ? 'MADI 1' : 'MADI 2'
		const allInputIds = Array.from(self.state.audioInputs.values()).map((input) => input.inputId)
		presets[`audioInputAllInputsSource_${source}`] = {
			type: 'button',
			category: 'Audio Inputs',
			name: `All Inputs - ${sourceLabel}`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `ALL INPUTS\\nto\\n${sourceLabel}`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'setAudioInputSource',
							options: {
								inputId: allInputIds,
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
						inputId: 0,
						source,
					},
					style: {
						bgcolor: Color.SpecteraBlue,
					},
				},
			],
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
									inputId: [input.inputId],
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

		//Instrument Switch Mode
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
						feedbackId: 'mobileDeviceConnected',
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.LightGray,
						},
					},
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

		//Backup Mode
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
					text: `$(spectera:${copyDevice.type}_${copyDevice.serial}_name)\\nto\\n$(spectera:${device.type}_${device.serial}_name)`,
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
				feedbacks: [
					{
						feedbackId: 'mobileDeviceConnected',
						options: {
							serial: copyDevice.serial,
						},
						style: {
							bgcolor: Color.LightGray,
						},
					},
					{
						feedbackId: 'mobileDeviceMicAudiolinkActive',
						options: {
							serial: copyDevice.serial,
						},
						style: {
							bgcolor: Color.SpecteraOrange,
						},
					},
				],
			}
		}

		//SEK / SKM Presets
		presets[`${deviceVariableId}_Header`] = {
			type: 'text',
			category: `${category}s`,
			name: `${device.name} (SN ${serial})`,
			text: '',
		}

		if (device.type === MtType.SEK) {
			presets[`${deviceVariableId}_MainInfo`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} Overall Status`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\nIEM-LQI-$(spectera:${deviceVariableId}_iem_lqi)\\nBAT: $(spectera:${deviceVariableId}_battery_level) %\\n$(spectera:${deviceVariableId}_headphone_plug_state)\\n$(spectera:${deviceVariableId}_headphone_volume) dB`,
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
						feedbackId: 'mobileDeviceHeadphonePlugState',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraRed,
						},
					},
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraBlue,
						},
					},
					{
						feedbackId: 'iemAudioLinkActive',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.Black,
						},
					},
				],
			}
		} else if (device.type === MtType.SKM) {
			presets[`${deviceVariableId}_MainInfo`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} Overall Status`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\nMIC-LQI-$(spectera:${deviceVariableId}_mic_lqi)\\nBAT: $(spectera:${deviceVariableId}_battery_level) %\\n$(spectera:${deviceVariableId}_headphone_plug_state)\\n$(spectera:${deviceVariableId}_headphone_volume) dB`,
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
				feedbacks: [],
			}
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
				text: `$(spectera:${deviceVariableId}_name)\\nSTATE\\n$(spectera:${deviceVariableId}_state)\\nLAST SEEN\\n$(spectera:${deviceVariableId}_last_connected)`,
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
					feedbackId: 'mobileDeviceBatteryLevel',
					options: {
						serial: device.serial,
						threshold: 100,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
				{
					feedbackId: 'mobileDeviceBatteryLevel',
					options: {
						serial: device.serial,
						threshold: 70,
					},
					style: {
						bgcolor: Color.DarkGreen,
					},
				},
				{
					feedbackId: 'mobileDeviceBatteryLevel',
					options: {
						serial: device.serial,
						threshold: 40,
					},
					style: {
						bgcolor: Color.SpecteraOrange,
					},
				},
				{
					feedbackId: 'mobileDeviceBatteryLow',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
				{
					feedbackId: 'mobileDeviceState',
					options: {
						serial: device.serial,
						state: MtState.Disconnected,
					},
					style: {
						bgcolor: Color.Black,
					},
				},
			],
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
				{
					feedbackId: 'mobileDeviceReverseIdentify',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.White,
						color: Color.Black,
					},
				},
			],
		}

		presets[`${deviceVariableId}_Rename`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Rename`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `RENAME ${serial}`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{
							actionId: 'mobileDeviceRename',
							options: {
								serial: device.serial,
								name: 'Message',
							},
						},
					],
					up: [],
				},
				{
					down: [
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

		presets[`${deviceVariableId}_InterferenceStatus`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Interference Status`,
			style: {
				// Base is Red — represents RSSI < -80 dBm (danger). Feedbacks layer Orange then Blue on top.
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nDOM: $(spectera:${deviceVariableId}_dominant_antenna)\\nRSSI:$(spectera:${deviceVariableId}_rssi)`,
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
					feedbackId: 'mobileDeviceRSSI',
					options: {
						serial: device.serial,
						rssiThreshold: -90,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
				// RSSI ≥ -80 dBm → Orange (low but not critical; upgrades from Red)
				{
					feedbackId: 'mobileDeviceRSSI',
					options: {
						serial: device.serial,
						rssiThreshold: -80,
					},
					style: {
						bgcolor: Color.SpecteraOrange,
					},
				},
				// RSSI ≥ -70 dBm → Blue (normal/good signal; upgrades from Orange)
				{
					feedbackId: 'mobileDeviceRSSI',
					options: {
						serial: device.serial,
						rssiThreshold: -70,
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
				text: `$(spectera:${deviceVariableId}_name)\\nInterference\\n\\n$(spectera:${deviceVariableId}_interference)`,
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
				{
					feedbackId: 'mobileDeviceInterference',
					options: {
						serial: device.serial,
						severity: 'High',
					},
					style: {
						bgcolor: Color.SpecteraOrange,
					},
				},
				{
					feedbackId: 'mobileDeviceInterference',
					options: {
						serial: device.serial,
						severity: 'Low',
					},
					style: {
						bgcolor: Color.DarkGreen,
					},
				},
				{
					feedbackId: 'mobileDeviceInterference',
					options: {
						serial: device.serial,
						severity: 'None',
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
				{
					feedbackId: 'mobileDeviceState',
					options: {
						serial: device.serial,
						state: MtState.Disconnected,
					},
					style: {
						bgcolor: Color.Black,
					},
				},
			],
		}

		if (device.type === MtType.SEK) {
			presets[`${deviceVariableId}_IEM_LQI`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} IEM LQI`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\nIEM LQI\\n$(spectera:${deviceVariableId}_iem_lqi)`,
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
						feedbackId: 'mobileDeviceIemLqi',
						options: {
							serial: device.serial,
							iemLqiThreshold: 1,
						},
						style: {
							bgcolor: Color.SpecteraRed,
						},
					},
					{
						feedbackId: 'mobileDeviceIemLqi',
						options: {
							serial: device.serial,
							iemLqiThreshold: 2,
						},
						style: {
							bgcolor: Color.SpecteraOrange,
						},
					},
					{
						feedbackId: 'mobileDeviceIemLqi',
						options: {
							serial: device.serial,
							iemLqiThreshold: 3,
						},
						style: {
							bgcolor: Color.DarkGreen,
						},
					},
					{
						feedbackId: 'mobileDeviceIemLqi',
						options: {
							serial: device.serial,
							iemLqiThreshold: 4,
						},
						style: {
							bgcolor: Color.SpecteraGreen,
						},
					},
				],
			}

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
				feedbacks: [
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraRed,
						},
					},
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraBlue,
						},
					},
					{
						feedbackId: 'iemAudioLinkActive',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.Black,
						},
					},
				],
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
				feedbacks: [
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraRed,
						},
					},
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraBlue,
						},
					},
					{
						feedbackId: 'iemAudioLinkActive',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.Black,
						},
					},
				],
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
				feedbacks: [
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraRed,
						},
					},
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraBlue,
						},
					},
					{
						feedbackId: 'iemAudioLinkActive',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.Black,
						},
					},
				],
			}

			presets[`${deviceVariableId}_HeadphoneVolumeSet`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} Phone Vol -1`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\SET -20`,
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
									action: 'set',
									adjustment: '-20',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraRed,
						},
					},
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraBlue,
						},
					},
					{
						feedbackId: 'iemAudioLinkActive',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.Black,
						},
					},
				],
			}

			presets[`${deviceVariableId}_HeadphoneVolumeRotarty`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} Phones Volume Rotary Knob`,
				options: {
					rotaryActions: true,
				},
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `$(spectera:${deviceVariableId}_name)\\nVOL\\n$(spectera:${deviceVariableId}_headphone_volume)dB`,
					size: 11,
					show_topbar: false,
				},
				previewStyle: {
					text: `$(spectera:${deviceVariableId}_name)\\nPHONES VOLUME ROTARY KNOB`,
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
				feedbacks: [
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraRed,
						},
					},
					{
						feedbackId: 'mobileDeviceHeadphonePlugState',
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.SpecteraBlue,
						},
					},
					{
						feedbackId: 'iemAudioLinkActive',
						isInverted: true,
						options: {
							serial: device.serial,
						},
						style: {
							bgcolor: Color.Black,
						},
					},
				],
			}
		}

		presets[`${deviceVariableId}_Mic_LQI`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Mic LQI`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nMIC LQI\\n$(spectera:${deviceVariableId}_mic_lqi)`,
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
					feedbackId: 'mobileDeviceMicLqi',
					options: {
						serial: device.serial,
						micLqiThreshold: 1,
					},
					style: {
						bgcolor: Color.SpecteraRed,
					},
				},
				{
					feedbackId: 'mobileDeviceIemLqi',
					options: {
						serial: device.serial,
						micLqiThreshold: 2,
					},
					style: {
						bgcolor: Color.SpecteraOrange,
					},
				},
				{
					feedbackId: 'mobileDeviceIemLqi',
					options: {
						serial: device.serial,
						micLqiThreshold: 3,
					},
					style: {
						bgcolor: Color.DarkGreen,
					},
				},
				{
					feedbackId: 'mobileDeviceIemLqi',
					options: {
						serial: device.serial,
						micLqiThreshold: 4,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
			],
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
			feedbacks: [
				{
					feedbackId: 'mobileDeviceMicAudiolinkActive',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.LightGray,
					},
				},
			],
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
			feedbacks: [
				{
					feedbackId: 'mobileDeviceMicAudiolinkActive',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.LightGray,
					},
				},
			],
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
			feedbacks: [
				{
					feedbackId: 'mobileDeviceMicAudiolinkActive',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.LightGray,
					},
				},
			],
		}

		presets[`${deviceVariableId}_GainSet`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Gain Set -20`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\SET -20`,
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
								action: 'set',
								adjustment: '-20',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'mobileDeviceMicAudiolinkActive',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.LightGray,
					},
				},
			],
		}

		presets[`${deviceVariableId}_PreampGainRotarty`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Preamp Gain Rotary Knob`,
			options: {
				rotaryActions: true,
			},
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `$(spectera:${deviceVariableId}_name)\\nPREAMP GAIN\\n$(spectera:${deviceVariableId}_mic_preamp_gain)dB`,
				size: 11,
				show_topbar: false,
			},
			previewStyle: {
				text: `$(spectera:${deviceVariableId}_name)\\nPREAMP GAIN ROTARY KNOB`,
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
			feedbacks: [
				{
					feedbackId: 'mobileDeviceMicAudiolinkActive',
					options: {
						serial: device.serial,
					},
					style: {
						bgcolor: Color.LightGray,
					},
				},
			],
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

	// Engineer Mode: shared input list used by both SEK device and engineer pack presets.
	const sortedInputsForEng = [...self.state.audioInputs.values()].sort((a, b) => a.inputId - b.inputId)

	// Helper to emit the stereo preset entries for a given serial + preset key prefix.
	const addEngModeStereoPresets = (keyPrefix: string, serial: string, removeLabel: string, baseBg: number): void => {
		presets[`${keyPrefix}_EngineerModeStereoHeader`] = {
			type: 'text',
			category: 'Engineer Mode',
			name: `${removeLabel} (SN ${serial}) - Stereo`,
			text: '',
		}
		presets[`${keyPrefix}_EngMode_remove`] = {
			type: 'button',
			category: 'Engineer Mode',
			name: `${removeLabel} Remove IEM Audio Link`,
			style: {
				bgcolor: baseBg,
				color: Color.White,
				text: `$(spectera:SEK_${serial}_name)\\n\\nREMOVE`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{ actionId: 'removeIemAudioLink', options: { serial } },
						{ actionId: 'mobileDeviceRename', options: { serial, name: removeLabel } },
					],
					up: [],
				},
			],
			feedbacks: [],
		}
		for (let i = 0; i < sortedInputsForEng.length; i += 2) {
			const input1 = sortedInputsForEng[i]
			const input2 = sortedInputsForEng[i + 1]
			if (!input2) break
			const pairLabel = `IN ${input1.inputId + 1} + ${input2.inputId + 1}`
			presets[`${keyPrefix}_EngMode_Pair_${input1.inputId}_${input2.inputId}`] = {
				type: 'button',
				category: 'Engineer Mode',
				name: `${removeLabel} - Input ${input1.inputId + 1} + ${input2.inputId + 1}`,
				style: {
					bgcolor: baseBg,
					color: Color.White,
					text: `$(spectera:SEK_${serial}_name)\\n\\n${pairLabel}`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'routeAudioInputToMobileDevice',
								options: { inputId: STEREO_INPUT_OFFSET + input1.inputId, serial, modeIdStereo: 7 },
							},
							{
								actionId: 'setAudioInputSource',
								options: { inputId: [input1.inputId, input2.inputId], source: 'passthrough' },
							},
							{
								actionId: 'mobileDeviceRename',
								options: {
									serial,
									name: `$(spectera:SEK_${serial}_name)-IN ${input1.inputId + 1}+${input2.inputId + 1}`,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'iemAudioInputLinked',
						options: { serial, inputId: STEREO_INPUT_OFFSET + input1.inputId },
						style: { bgcolor: Color.SpecteraBlue },
					},
					{
						feedbackId: 'iemAudioInputNoLinkId',
						options: { serial },
						style: { bgcolor: Color.Black },
					},
				],
			}
		}
	}

	// Helper to emit the mono preset entries for a given serial + preset key prefix.
	const addEngModeMonoPresets = (keyPrefix: string, serial: string, removeLabel: string, baseBg: number): void => {
		presets[`${keyPrefix}_EngineerModeMonoHeader`] = {
			type: 'text',
			category: 'Engineer Mode',
			name: `${removeLabel} (SN ${serial}) - Mono`,
			text: '',
		}
		presets[`${keyPrefix}_EngMode_Mono_remove`] = {
			type: 'button',
			category: 'Engineer Mode',
			name: `${removeLabel} Remove IEM Audio Link`,
			style: {
				bgcolor: baseBg,
				color: Color.White,
				text: `$(spectera:SEK_${serial}_name)\\n\\nREMOVE`,
				size: 11,
				show_topbar: false,
			},
			steps: [
				{
					down: [
						{ actionId: 'removeIemAudioLink', options: { serial } },
						{ actionId: 'mobileDeviceRename', options: { serial, name: removeLabel } },
					],
					up: [],
				},
			],
			feedbacks: [],
		}
		for (const input of sortedInputsForEng) {
			presets[`${keyPrefix}_EngMode_${input.inputId}`] = {
				type: 'button',
				category: 'Engineer Mode',
				name: `${removeLabel} - Input ${input.inputId + 1} Engineer Mode`,
				style: {
					bgcolor: baseBg,
					color: Color.White,
					text: `$(spectera:SEK_${serial}_name)\\n\\nIN ${input.inputId + 1}`,
					size: 11,
					show_topbar: false,
				},
				steps: [
					{
						down: [
							{
								actionId: 'routeAudioInputToMobileDevice',
								options: { inputId: input.inputId, serial, modeIdMono: 4 },
							},
							{ actionId: 'setAudioInputSource', options: { inputId: [input.inputId], source: 'passthrough' } },
							{
								actionId: 'mobileDeviceRename',
								options: {
									serial,
									name: `$(spectera:SEK_${serial}_name)-IN ${input.inputId + 1}`,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'iemAudioInputLinked',
						options: { serial, inputId: input.inputId },
						style: { bgcolor: Color.SpecteraBlue },
					},
					{
						feedbackId: 'iemAudioInputNoLinkId',
						options: { serial },
						style: { bgcolor: Color.Black },
					},
				],
			}
		}
	}

	// Engineer Mode: detected SEK devices (listed before config-defined packs).
	const sekDevicesForEng = ([...self.state.mobileDevices.values()] as MobileDevice[])
		.filter((d): d is SEKDevice => d.type === MtType.SEK && !!d.serial)
		.sort((a, b) => a.name.localeCompare(b.name))

	// SEK stereo pass (all stereo sections first)
	for (let i = 0; i < sekDevicesForEng.length; i++) {
		const device = sekDevicesForEng[i]
		const engPackBg = i % 2 === 0 ? Color.SpecteraDarkGray : Color.LightGray
		addEngModeStereoPresets(`SEK_${device.serial}_eng`, device.serial!, device.name, engPackBg)
	}
	// SEK mono pass (all mono sections after stereo)
	for (let i = 0; i < sekDevicesForEng.length; i++) {
		const device = sekDevicesForEng[i]
		const engPackBg = i % 2 === 0 ? Color.SpecteraDarkGray : Color.LightGray
		addEngModeMonoPresets(`SEK_${device.serial}_eng`, device.serial!, device.name, engPackBg)
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
