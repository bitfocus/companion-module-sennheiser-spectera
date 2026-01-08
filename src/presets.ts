import { CompanionPresetDefinitions } from '@companion-module/base'
import { SpecteraInstance } from './main.js'
import { Color } from './utils.js'
import { RFChannels, AntennaPortId, BaseStationStatus, DeviceStatus } from './types.js'

export function UpdatePresets(self: SpecteraInstance): void {
	const presets: CompanionPresetDefinitions = {}
	//DADs
	for (const dad of Object.keys(AntennaPortId)) {
		const port = dad.toLowerCase()
		presets[`dad${port}Header`] = {
			type: 'text',
			category: 'DAD',
			name: `DAD ${dad}`,
			text: '',
		}
		presets[`dad${port}State`] = {
			type: 'button',
			category: 'DAD',
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
			category: 'DAD',
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
			category: 'DAD',
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
			category: 'DAD',
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
			category: 'DAD',
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
			category: 'DAD',
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
	self.setPresetDefinitions(presets)
}
