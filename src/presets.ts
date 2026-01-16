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
} from './types.js'

function sanitizeName(name: string): string {
	return name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function UpdatePresets(self: SpecteraInstance): void {
	const presets: CompanionPresetDefinitions = {}
	//DADs
	for (const dad of Object.keys(AntennaPortId)) {
		const port = dad.toLowerCase()
		presets[`dad${port}Header`] = {
			type: 'text',
			category: 'DADs',
			name: `DAD ${dad}`,
			text: '',
		}
		presets[`dad${port}State`] = {
			type: 'button',
			category: 'DADs',
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
			category: 'DADs',
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
		presets[`dad${port}Bindings`] = {
			type: 'button',
			category: 'DADs',
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
			category: 'DADs',
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
			category: 'DADs',
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
			category: 'DADs',
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

	//RF Channels
	for (const channelName of Object.keys(RFChannels)) {
		const channelId = RFChannels[channelName as keyof typeof RFChannels]
		if (channelId === RFChannels.Off) continue

		const channelIndex = channelId === RFChannels['RF Channel 1'] ? 0 : 1
		const channelLabel = channelName

		presets[`rf${channelIndex}Header`] = {
			type: 'text',
			category: 'RF Channels',
			name: `${channelLabel}`,
			text: '',
		}

		presets[`rf${channelIndex}StateInfo`] = {
			type: 'button',
			category: 'RF Channels',
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
			category: 'RF Channels',
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
			category: 'RF Channels',
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
			category: 'RF Channels',
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
			category: 'RF Channels',
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
			category: 'RF Channels',
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

	//Mobile Devices
	const mobileDevices = [...self.state.mobileDevices.values()]
	mobileDevices.sort((a, b) => a.name.localeCompare(b.name))

	for (const device of mobileDevices) {
		const name = sanitizeName(device.name)
		const type = device.type
		const serial = device.serial
		const deviceVariableId = `${type}_${name}_${serial}`
		const category = device.type === MtType.SEK ? 'SEK' : 'SKM'

		presets[`${deviceVariableId}_Header`] = {
			type: 'text',
			category: `${category}s`,
			name: `${device.name} (${serial})`,
			text: '',
		}

		presets[`${deviceVariableId}_Battery`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Battery`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${device.name}\\nBATTERY\\n$(spectera:${deviceVariableId}_battery_level)%\\n$(spectera:${deviceVariableId}_battery_runtime)min`,
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
						mtUid: device.mtUid,
					},
					style: {
						bgcolor: Color.SpecteraRed,
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
				text: `${device.name}\\nSTATE\\n$(spectera:${deviceVariableId}_state)`,
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
						mtUid: device.mtUid,
					},
					style: {
						bgcolor: Color.SpecteraGreen,
					},
				},
			],
		}

		if (device.type === MtType.SEK) {
			presets[`${deviceVariableId}_HeadphoneVolume`] = {
				type: 'button',
				category: `${category}s`,
				name: `${device.name} Headphone Vol`,
				style: {
					bgcolor: Color.Black,
					color: Color.White,
					text: `${device.name}\\nPHONES VOL\\n$(spectera:${deviceVariableId}_headphone_volume)dB`,
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

		presets[`${deviceVariableId}_Gain`] = {
			type: 'button',
			category: `${category}s`,
			name: `${device.name} Gain`,
			style: {
				bgcolor: Color.Black,
				color: Color.White,
				text: `${device.name}\\nPREAMP GAIN\\n$(spectera:${deviceVariableId}_mic_preamp_gain)dB`,
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

	//Base Station
	presets['baseStationHeader'] = {
		type: 'text',
		category: 'Base Station',
		name: 'General Status',
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
	presets['baseStationPsuHeader'] = {
		type: 'text',
		category: 'Base Station',
		name: 'PSU Status',
		text: '',
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

	presets['baseStationTempHeader'] = {
		type: 'text',
		category: 'Base Station',
		name: 'Temperature Status',
		text: '',
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

	presets['baseStationFanHeader'] = {
		type: 'text',
		category: 'Base Station',
		name: 'Fan Status',
		text: '',
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
		category: 'Audio Interfaces',
		name: 'Audio Network (Dante)',
		text: '',
	}
	presets['audioNetworkStatus'] = {
		type: 'button',
		category: 'Audio Interfaces',
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
	presets['madi1Header'] = {
		type: 'text',
		category: 'Audio Interfaces',
		name: 'MADI 1',
		text: '',
	}
	presets['madi1InputStatus'] = {
		type: 'button',
		category: 'Audio Interfaces',
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
		category: 'Audio Interfaces',
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
	presets['madi2Header'] = {
		type: 'text',
		category: 'Audio Interfaces',
		name: 'MADI 2',
		text: '',
	}
	presets['madi2InputStatus'] = {
		type: 'button',
		category: 'Audio Interfaces',
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
		category: 'Audio Interfaces',
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
	presets['wordclockHeader'] = {
		type: 'text',
		category: 'Audio Interfaces',
		name: 'Wordclock',
		text: '',
	}
	presets['wordclockInputStatus'] = {
		type: 'button',
		category: 'Audio Interfaces',
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
		category: 'Audio Interfaces',
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
