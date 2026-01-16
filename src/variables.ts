import type { SpecteraInstance } from './main.js'
import type {
	AudioInput,
	AudioOutput,
	RfChannel,
	Antenna,
	MobileDevice,
	PsuState,
	TempState,
	FanState,
	BaseStationIdentity,
	BaseStationState,
	BaseStationSite,
} from './types.js'
import { MtType, RfState, RFChannels, RfStateStartup, PsuStatus, MicLowCutHzSEK, MicLowCutHzSKM } from './types.js'
import {
	StateMap,
	AudioNetworkStateMap,
	MadiStateMap,
	MadiInputStateMap,
	MadiOutputStateMap,
	WordclockInputStateMap,
	WordclockOutputStateMap,
} from './state_maps.js'

const rfStateStartupLabels: Record<RfStateStartup, string> = {
	[RfStateStartup.Active]: 'Active',
	[RfStateStartup.Muted]: 'Muted',
	[RfStateStartup.LastState]: 'Last State',
}

const psuStatusLabels: Record<PsuStatus, string> = {
	[PsuStatus.Connected]: 'Connected',
	[PsuStatus.Unconnected]: 'Unconnected',
	[PsuStatus.Disconnected]: 'Disconnected',
}

function sanitizeName(name: string): string {
	return name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function addVariablesFromMap<T>(
	variables: { variableId: string; name: string }[],
	map: StateMap<T>,
	prefix: string,
	labelPrefix: string,
): void {
	for (const key of Object.keys(map) as (keyof T)[]) {
		const entry = map[key]
		if (entry?.variable) {
			variables.push({
				variableId: `${prefix}${entry.variable}`,
				name: `${labelPrefix} - ${String(key)}`,
			})
		}
	}
}

function getVariablesFromMap<T>(map: StateMap<T>, state: T, prefix: string): Record<string, any> {
	const values: Record<string, any> = {}
	for (const key of Object.keys(map) as (keyof T)[]) {
		const entry = map[key]
		if (entry?.variable && entry.valueFn) {
			const val = entry.valueFn(state[key], state)
			values[`${prefix}${entry.variable}`] = val
		}
	}
	return values
}

export function UpdateVariableDefinitions(self: SpecteraInstance): void {
	const variables: { variableId: string; name: string }[] = [
		// Base Station Info
		{ variableId: 'base_station_state', name: 'Base Station - State' },
		{ variableId: 'base_station_name', name: 'Base Station - Name' },
		{ variableId: 'base_station_location', name: 'Base Station - Location' },
		{ variableId: 'base_station_position', name: 'Base Station - Position' },
		{ variableId: 'base_station_model', name: 'Base Station - Product Model' },
		{ variableId: 'base_station_serial', name: 'Base Station - Serial Number' },
		{ variableId: 'base_station_version', name: 'Base Station - Version' },
		{ variableId: 'base_station_warnings', name: 'Base Station - Warnings' },

		// Health
		{ variableId: 'health_psu_1_state', name: 'PSU 1 - State' },
		{ variableId: 'health_psu_2_state', name: 'PSU 2 - State' },
		{ variableId: 'health_temp_state', name: 'Overall Temperature - State' },
		{ variableId: 'health_fan_1_error', name: 'Fan 1 - Error State' },
		{ variableId: 'health_fan_2_error', name: 'Fan 2 - Error State' },
		{ variableId: 'health_fan_3_error', name: 'Fan 3 - Error State' },
		{ variableId: 'health_fan_3_error', name: 'Fan 3 - Error State' },
	]

	// Dante I/O
	addVariablesFromMap(variables, AudioNetworkStateMap, 'dante_', 'Dante I/O')

	// MADI 1
	addVariablesFromMap(variables, MadiStateMap, 'madi_1_', 'MADI 1')
	addVariablesFromMap(variables, MadiInputStateMap, 'madi_1_', 'MADI 1 Input')
	addVariablesFromMap(variables, MadiOutputStateMap, 'madi_1_', 'MADI 1 Output')

	// MADI 2
	addVariablesFromMap(variables, MadiStateMap, 'madi_2_', 'MADI 2')
	addVariablesFromMap(variables, MadiInputStateMap, 'madi_2_', 'MADI 2 Input')
	addVariablesFromMap(variables, MadiOutputStateMap, 'madi_2_', 'MADI 2 Output')

	// Wordclock
	addVariablesFromMap(variables, WordclockInputStateMap, 'wordclock_', 'Wordclock Input')
	addVariablesFromMap(variables, WordclockOutputStateMap, 'wordclock_', 'Wordclock Output')

	// Audio Inputs
	for (const input of self.state.audioInputs.values()) {
		const displayId = input.inputId + 1
		variables.push(
			{
				variableId: `audio_input_${displayId}_name`,
				name: `Audio Input ${displayId} Name`,
			},
			{
				variableId: `audio_input_${displayId}_iem_link_id`,
				name: `Audio Input ${displayId} IEM Link ID`,
			},
			{
				variableId: `audio_input_${displayId}_source`,
				name: `Audio Input ${displayId} Source`,
			},
		)
	}

	const interfaces = ['Madi1', 'Madi2', 'Dante']
	const directions = ['In', 'Out']

	for (const iface of interfaces) {
		for (const dir of directions) {
			const ifaceNameSnake = `${iface.toLowerCase()}_${dir.toLowerCase()}`

			for (let i = 1; i <= 32; i++) {
				variables.push(
					{
						variableId: `audio_level_${ifaceNameSnake}_${i}_peak`,
						name: `Audio Level ${iface} ${dir} Ch ${i} Peak (dBFS)`,
					},
					{
						variableId: `audio_level_${ifaceNameSnake}_${i}_rms`,
						name: `Audio Level ${iface} ${dir} Ch ${i} RMS (dBFS)`,
					},
				)
			}
		}
	}

	// Audio Outputs
	for (const output of self.state.audioOutputs.values()) {
		variables.push({
			variableId: `audio_output_${output.outputId}_mic_link`,
			name: `Audio Output ${output.outputId} Mic Link ID`,
		})
	}

	// RF Channels
	for (const channel of self.state.rfChannels.values()) {
		const displayId = channel.rfChannelId + 1
		variables.push(
			{
				variableId: `rf_channel_${displayId}_tx_power`,
				name: `RF Channel ${displayId} - TX Power`,
			},
			{
				variableId: `rf_channel_${displayId}_frequency`,
				name: `RF Channel ${displayId} - Frequency (MHz)`,
			},
			{
				variableId: `rf_channel_${displayId}_bandwidth_mode`,
				name: `RF Channel ${displayId} - Bandwidth Mode`,
			},
			{
				variableId: `rf_channel_${displayId}_state`,
				name: `RF Channel ${displayId} - State`,
			},
			{
				variableId: `rf_channel_${displayId}_rf_restriction_violation`,
				name: `RF Channel ${displayId} - RF Restriction Violation`,
			},
			{
				variableId: `rf_channel_${displayId}_startup_state`,
				name: `RF Channel ${displayId} - Startup State`,
			},
		)
	}

	// DADs
	for (const antenna of self.state.antennas.values()) {
		const port = sanitizeName(antenna.antennaPortId)
		variables.push(
			{
				variableId: `dad_${port}_state`,
				name: `DAD ${antenna.antennaPortId} - State`,
			},
			{
				variableId: `dad_${port}_type`,
				name: `DAD ${antenna.antennaPortId} - Type`,
			},
			{
				variableId: `dad_${port}_error_details`,
				name: `DAD ${antenna.antennaPortId} - Error Details`,
			},
			{
				variableId: `dad_${port}_high_temp_warning`,
				name: `DAD ${antenna.antennaPortId} - High Temperature Warning`,
			},
			{
				variableId: `dad_${port}_packet_error_warning`,
				name: `DAD ${antenna.antennaPortId} - Packet Error Warning`,
			},
			{
				variableId: `dad_${port}_temperature`,
				name: `DAD ${antenna.antennaPortId} - Temperature`,
			},
			{
				variableId: `dad_${port}_type`,
				name: `DAD ${antenna.antennaPortId} - Type`,
			},
			{
				variableId: `dad_${port}_version`,
				name: `DAD ${antenna.antennaPortId} - Version`,
			},
			{
				variableId: `dad_${port}_identify`,
				name: `DAD ${antenna.antennaPortId} - Identify`,
			},
			{
				variableId: `dad_${port}_led_brightness`,
				name: `DAD ${antenna.antennaPortId} - LED Brightness`,
			},
			{
				variableId: `dad_${port}_bindings`,
				name: `DAD ${antenna.antennaPortId} - Bindings`,
			},
			{
				variableId: `dad_${port}_mismatch`,
				name: `DAD ${antenna.antennaPortId} - Mismatch`,
			},
		)
	}

	// Mobile Devices
	for (const device of self.state.mobileDevices.values()) {
		const name = sanitizeName(device.name)
		const type = device.type
		const serial = device.serial

		const deviceVariableId = `${type}_${name}_${serial}`
		const deviceVariableLabel = `${type} - ${device.name} (${serial})`
		variables.push(
			{
				variableId: `${deviceVariableId}_mt_uid`,
				name: `${deviceVariableLabel} - MT UID`,
			},
			{
				variableId: `${deviceVariableId}_mt_type`,
				name: `${deviceVariableLabel} - MT Type`,
			},
			{
				variableId: `${deviceVariableId}_frequency_range`,
				name: `${deviceVariableLabel} - Frequency Range`,
			},
			{
				variableId: `${deviceVariableId}_rf_channel_id`,
				name: `${deviceVariableLabel} - RF Channel ID`,
			},
			{
				variableId: `${deviceVariableId}_identify`,
				name: `${deviceVariableLabel} - Identify`,
			},
			{
				variableId: `${deviceVariableId}_reverse_identify`,
				name: `${deviceVariableLabel} - Reverse Identify`,
			},
			{
				variableId: `${deviceVariableId}_serial`,
				name: `${deviceVariableLabel} - Serial`,
			},
			{
				variableId: `${deviceVariableId}_connected`,
				name: `${deviceVariableLabel} - Connected`,
			},
			{
				variableId: `${deviceVariableId}_sleep`,
				name: `${deviceVariableLabel} - Sleep`,
			},
			{
				variableId: `${deviceVariableId}_state`,
				name: `${deviceVariableLabel} - State`,
			},
			{
				variableId: `${deviceVariableId}_last_connected`,
				name: `${deviceVariableLabel} - Last Connected`,
			},
			{
				variableId: `${deviceVariableId}_battery_level`,
				name: `${deviceVariableLabel} - Battery Level`,
			},
			{
				variableId: `${deviceVariableId}_battery_runtime`,
				name: `${deviceVariableLabel} - Battery Runtime`,
			},
			{
				variableId: `${deviceVariableId}_battery_low`,
				name: `${deviceVariableLabel} - Battery Low`,
			},
			{
				variableId: `${deviceVariableId}_version`,
				name: `${deviceVariableLabel} - Version`,
			},
			{
				variableId: `${deviceVariableId}_version_mismatch`,
				name: `${deviceVariableLabel} - Version Mismatch`,
			},
			{
				variableId: `${deviceVariableId}_fcc_id`,
				name: `${deviceVariableLabel} - FCC ID`,
			},
			{
				variableId: `${deviceVariableId}_led_brightness`,
				name: `${deviceVariableLabel} - LED Brightness`,
			},
			{
				variableId: `${deviceVariableId}_sw_update_possible`,
				name: `${deviceVariableLabel} - SW Update Possible`,
			},
			{
				variableId: `${deviceVariableId}_sw_update_progress`,
				name: `${deviceVariableLabel} - SW Update Progress`,
			},
			{
				variableId: `${deviceVariableId}_mic_audiolink_id`,
				name: `${deviceVariableLabel} - Mic AudioLink ID`,
			},
			{
				variableId: `${deviceVariableId}_mic_audiolink_active`,
				name: `${deviceVariableLabel} - Mic AudioLink Active`,
			},
			{
				variableId: `${deviceVariableId}_mic_test_tone_enabled`,
				name: `${deviceVariableLabel} - Mic Test Tone Enabled`,
			},
			{
				variableId: `${deviceVariableId}_mic_test_tone_level`,
				name: `${deviceVariableLabel} - Mic Test Tone Level`,
			},
			{
				variableId: `${deviceVariableId}_command_state`,
				name: `${deviceVariableLabel} - Command State`,
			},
			{
				variableId: `${deviceVariableId}_mic_lqi`,
				name: `${deviceVariableLabel} - Mic LQI`,
			},
			{
				variableId: `${deviceVariableId}_interference`,
				name: `${deviceVariableLabel} - Interference`,
			},
			{
				variableId: `${deviceVariableId}_dominant_antenna`,
				name: `${deviceVariableLabel} - Dominant Antenna`,
			},
			{
				variableId: `${deviceVariableId}_rssi`,
				name: `${deviceVariableLabel} - RSSI`,
			},
		)

		// Type specific
		if (device.type === MtType.SEK) {
			variables.push(
				{
					variableId: `${deviceVariableId}_headphone_volume`,
					name: `${deviceVariableLabel} - Headphone Volume`,
				},
				{
					variableId: `${deviceVariableId}_headphone_balance`,
					name: `${deviceVariableLabel} - Headphone Balance`,
				},
				{
					variableId: `${deviceVariableId}_mic_preamp_gain`,
					name: `${deviceVariableLabel} - Mic Preamp Gain`,
				},
				{
					variableId: `${deviceVariableId}_mic_lowcut_hz`,
					name: `${deviceVariableLabel} - Mic Lowcut Hz`,
				},
				{
					variableId: `${deviceVariableId}_iem_audiolink_id`,
					name: `${deviceVariableLabel} - IEM AudioLink ID`,
				},
				{
					variableId: `${deviceVariableId}_iem_audiolink_active`,
					name: `${deviceVariableLabel} - IEM AudioLink Active`,
				},
				{
					variableId: `${deviceVariableId}_headphone_plug_state`,
					name: `${deviceVariableLabel} - Headphone Plug State`,
				},
				{
					variableId: `${deviceVariableId}_headphone_volume_max`,
					name: `${deviceVariableLabel} - Headphone Volume Max`,
				},
				{
					variableId: `${deviceVariableId}_headphone_volume_min`,
					name: `${deviceVariableLabel} - Headphone Volume Min`,
				},
				{
					variableId: `${deviceVariableId}_mic_line_selection`,
					name: `${deviceVariableLabel} - Mic/Line Selection`,
				},
				{
					variableId: `${deviceVariableId}_mic_line_selection_auto_value`,
					name: `${deviceVariableLabel} - Mic/Line Selection Auto Value`,
				},
				{
					variableId: `${deviceVariableId}_cable_emulation`,
					name: `${deviceVariableLabel} - Cable Emulation`,
				},
				{
					variableId: `${deviceVariableId}_iem_lqi`,
					name: `${deviceVariableLabel} - IEM LQI`,
				},
			)
		} else if (device.type === MtType.SKM) {
			variables.push(
				{
					variableId: `${deviceVariableId}_mic_preamp_gain`,
					name: `${deviceVariableLabel} - Mic Preamp Gain`,
				},
				{
					variableId: `${deviceVariableId}_mic_lowcut_hz`,
					name: `${deviceVariableLabel} - Mic Lowcut Hz`,
				},
				{
					variableId: `${deviceVariableId}_command_behavior`,
					name: `${deviceVariableLabel} - Command Behavior`,
				},
				{
					variableId: `${deviceVariableId}_mic_module`,
					name: `${deviceVariableLabel} - Mic Module`,
				},
			)
		}
	}

	self.setVariableDefinitions(variables)
}

export function getAudioInputVariables(input: AudioInput): Record<string, any> {
	const displayId = input.inputId + 1
	return {
		[`audio_input_${displayId}_source`]: input.source,
		[`audio_input_${displayId}_name`]: input.name,
		[`audio_input_${displayId}_iem_link_id`]: input.iemAudiolinkId,
	}
}

export function getAudioOutputVariables(output: AudioOutput): Record<string, any> {
	return {
		[`audio_output_${output.outputId}_mic_link`]: output.micAudiolinkId,
	}
}

export function getRfChannelVariables(channel: RfChannel): Record<string, any> {
	const displayId = channel.rfChannelId + 1
	return {
		[`rf_channel_${displayId}_tx_power`]: channel.txPower,
		[`rf_channel_${displayId}_frequency`]: channel.frequency / 1000,
		[`rf_channel_${displayId}_bandwidth_mode`]: channel.bandwidthMode,
		[`rf_channel_${displayId}_rf_restriction_violation`]: channel.rfRestrictionViolation,
		[`rf_channel_${displayId}_state`]: channel.rfState === RfState.Active ? 'Active' : 'Muted',
		[`rf_channel_${displayId}_startup_state`]: channel.rfStateOnStartup
			? rfStateStartupLabels[channel.rfStateOnStartup]
			: 'Unknown',
	}
}

export function getAntennaVariables(antenna: Antenna): Record<string, any> {
	const port = sanitizeName(antenna.antennaPortId)
	const binding = antenna.bindings[0]?.binding
	const bindingLabel = Object.keys(RFChannels).find((key) => RFChannels[key as keyof typeof RFChannels] === binding)

	return {
		[`dad_${port}_state`]: antenna.state,
		[`dad_${port}_type`]: antenna.type,
		[`dad_${port}_error_details`]: antenna.errorStateDetails,
		[`dad_${port}_high_temp_warning`]: antenna.warningHighTemperature,
		[`dad_${port}_packet_error_warning`]: antenna.warningPacketError,
		[`dad_${port}_temperature`]: antenna.temperature,
		[`dad_${port}_version`]: antenna.version,
		[`dad_${port}_identify`]: antenna.identify,
		[`dad_${port}_led_brightness`]: antenna.ledBrightness,
		[`dad_${port}_bindings`]: bindingLabel ?? 'None',
		[`dad_${port}_mismatch`]: antenna.bindings[0]?.mismatch,
	}
}

export function getMobileDeviceVariables(device: MobileDevice): Record<string, any> {
	const name = sanitizeName(device.name)
	const type = device.type
	const serial = device.serial
	const deviceVariableId = `${type}_${name}_${serial}`

	const variables: Record<string, any> = {
		[`${deviceVariableId}_mt_uid`]: device.mtUid,
		[`${deviceVariableId}_mt_type`]: device.type,
		[`${deviceVariableId}_frequency_range`]: device.frequencyRange,
		[`${deviceVariableId}_rf_channel_id`]: device.rfChannelId,
		[`${deviceVariableId}_identify`]: device.identify,
		[`${deviceVariableId}_reverse_identify`]: device.reverseIdentify,
		[`${deviceVariableId}_serial`]: device.serial,
		[`${deviceVariableId}_connected`]: device.connected,
		[`${deviceVariableId}_sleep`]: device.sleep,
		[`${deviceVariableId}_state`]: device.state,
		[`${deviceVariableId}_battery_level`]: device.batteryFillLevel === -1 ? 'OFF' : device.batteryFillLevel,
		[`${deviceVariableId}_battery_runtime`]: device.batteryRuntime === -1 ? 'OFF' : device.batteryRuntime,
		[`${deviceVariableId}_battery_low`]: device.batteryLow,
		[`${deviceVariableId}_version`]: device.version,
		[`${deviceVariableId}_version_mismatch`]: device.versionMismatch,
		[`${deviceVariableId}_fcc_id`]: device.fccId,
		[`${deviceVariableId}_led_brightness`]: device.ledBrightness,
		[`${deviceVariableId}_sw_update_possible`]: device.swUpdatePossible,
		[`${deviceVariableId}_sw_update_progress`]: device.swUpdateProgress,
		[`${deviceVariableId}_mic_audiolink_id`]: device.micAudiolinkId,
		[`${deviceVariableId}_mic_audiolink_active`]: device.micAudiolinkActive,
		[`${deviceVariableId}_mic_test_tone_enabled`]: device.micTestToneEnabled,
		[`${deviceVariableId}_mic_test_tone_level`]: device.micTestToneLevel,
		[`${deviceVariableId}_command_state`]: device.commandState,
		[`${deviceVariableId}_mic_lqi`]: device.micLqi,
		[`${deviceVariableId}_interference`]: device.interference?.severity,
		[`${deviceVariableId}_dominant_antenna`]: device.dominantAntenna,
		[`${deviceVariableId}_rssi`]: device.rssi,
	}

	if (device.type === MtType.SEK) {
		variables[`${deviceVariableId}_headphone_volume`] = device.headphoneVolume
		variables[`${deviceVariableId}_headphone_balance`] = device.headphoneBalance
		variables[`${deviceVariableId}_mic_preamp_gain`] = device.micPreampGain
		variables[`${deviceVariableId}_mic_lowcut_hz`] =
			device.micLowCutHz === MicLowCutHzSEK.Off ? 'Off' : device.micLowCutHz
		variables[`${deviceVariableId}_iem_audiolink_id`] = device.iemAudiolinkId
		variables[`${deviceVariableId}_iem_audiolink_active`] = device.iemAudiolinkActive
		variables[`${deviceVariableId}_headphone_plug_state`] = device.headphonePlugState
		variables[`${deviceVariableId}_headphone_volume_max`] = device.headphoneVolumeMax
		variables[`${deviceVariableId}_headphone_volume_min`] = device.headphoneVolumeMin
		variables[`${deviceVariableId}_mic_line_selection`] = device.micLineSelection
		variables[`${deviceVariableId}_mic_line_selection_auto_value`] = device.micLineSelectionAutoValue
		variables[`${deviceVariableId}_cable_emulation`] = device.cableEmulation
		variables[`${deviceVariableId}_iem_lqi`] = device.iemLqi
	} else if (device.type === MtType.SKM) {
		variables[`${deviceVariableId}_mic_preamp_gain`] = device.micPreampGain
		variables[`${deviceVariableId}_mic_lowcut_hz`] =
			device.micLowCutHz === MicLowCutHzSKM.Off ? 'Off' : device.micLowCutHz
		variables[`${deviceVariableId}_command_behavior`] = device.commandBehavior
		variables[`${deviceVariableId}_mic_module`] = device.micModule
	}

	return variables
}

export function getPsuVariables(state: PsuState): Record<string, any> {
	return {
		health_psu_1_state: psuStatusLabels[state.psu1],
		health_psu_2_state: psuStatusLabels[state.psu2],
	}
}

export function getTempVariables(state: TempState): Record<string, any> {
	return {
		health_temp_state: state.value,
	}
}

export function getFanVariables(fanId: string, state: FanState): Record<string, any> {
	const fanNumber = fanId.split('_')[1]
	return {
		[`health_fan_${fanNumber}_error`]: state.errorState.value,
	}
}

export function getBaseStationIdentityVariables(identity: BaseStationIdentity): Record<string, any> {
	return {
		base_station_model: identity.product,
		base_station_serial: identity.serial,
		base_station_version: identity.hardwareRevision,
	}
}

export function getBaseStationStateVariables(state: BaseStationState): Record<string, any> {
	return {
		base_station_state: state.state,
		base_station_warnings: state.warnings?.length ? state.warnings.join(', ') : 'None',
	}
}

export function getBaseStationSiteVariables(site: BaseStationSite): Record<string, any> {
	return {
		base_station_name: site.deviceName,
		base_station_location: site.location,
		base_station_position: site.position,
	}
}

export function UpdateVariableValues(self: SpecteraInstance): void {
	let values: Record<string, string | number | boolean | undefined> = {}

	// Base Station Info
	if (self.state.basestation.state) {
		values = { ...values, ...getBaseStationStateVariables(self.state.basestation.state) }
	}
	if (self.state.basestation.site) {
		values = { ...values, ...getBaseStationSiteVariables(self.state.basestation.site) }
	}
	if (self.state.basestation.identity) {
		values = { ...values, ...getBaseStationIdentityVariables(self.state.basestation.identity) }
	}

	// Health
	values = { ...values, ...getPsuVariables(self.state.health.psu) }
	values = { ...values, ...getTempVariables(self.state.health.temp) }
	for (const [fanId, fanState] of Object.entries(self.state.health.fans)) {
		if (fanState) {
			values = { ...values, ...getFanVariables(fanId, fanState) }
		}
	}

	if (self.state.audioNetwork) {
		values = { ...values, ...getVariablesFromMap(AudioNetworkStateMap, self.state.audioNetwork, 'dante_') }
	}
	if (self.state.madi1) {
		values = { ...values, ...getVariablesFromMap(MadiStateMap, self.state.madi1, 'madi_1_') }
		values = { ...values, ...getVariablesFromMap(MadiInputStateMap, self.state.madi1.inputStatus, 'madi_1_') }
		values = { ...values, ...getVariablesFromMap(MadiOutputStateMap, self.state.madi1.outputStatus, 'madi_1_') }
	}
	if (self.state.madi2) {
		values = { ...values, ...getVariablesFromMap(MadiStateMap, self.state.madi2, 'madi_2_') }
		values = { ...values, ...getVariablesFromMap(MadiInputStateMap, self.state.madi2.inputStatus, 'madi_2_') }
		values = { ...values, ...getVariablesFromMap(MadiOutputStateMap, self.state.madi2.outputStatus, 'madi_2_') }
	}
	if (self.state.wordclock) {
		values = {
			...values,
			...getVariablesFromMap(WordclockInputStateMap, self.state.wordclock.inputStatus, 'wordclock_'),
		}
		values = {
			...values,
			...getVariablesFromMap(WordclockOutputStateMap, self.state.wordclock.outputStatus, 'wordclock_'),
		}
	}

	// Audio Inputs
	for (const input of self.state.audioInputs.values()) {
		values = { ...values, ...getAudioInputVariables(input) }
	}

	// Audio Outputs
	for (const output of self.state.audioOutputs.values()) {
		values = { ...values, ...getAudioOutputVariables(output) }
	}

	// RF Channels
	for (const channel of self.state.rfChannels.values()) {
		values = { ...values, ...getRfChannelVariables(channel) }
	}

	// Antennas
	for (const antenna of self.state.antennas.values()) {
		values = { ...values, ...getAntennaVariables(antenna) }
	}

	// Mobile Devices
	for (const device of self.state.mobileDevices.values()) {
		values = { ...values, ...getMobileDeviceVariables(device) }
	}
	self.setVariableValues(values)
}
