import type { SpecteraInstance } from './main.js'
import { MtType, RfState, RFChannels, RfStateStartup, PsuStatus } from './types.js'

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
	]

	// Audio Inputs
	for (const input of self.state.audioInputs.values()) {
		variables.push(
			{
				variableId: `audio_input_${input.inputId}_name`,
				name: `Audio Input ${input.inputId} Name`,
			},
			{
				variableId: `audio_input_${input.inputId}_iem_link_id`,
				name: `Audio Input ${input.inputId} IEM Link ID`,
			},
			{
				variableId: `audio_input_${input.inputId}_source`,
				name: `Audio Input ${input.inputId} Source`,
			},
		)
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

export function UpdateVariableValues(self: SpecteraInstance): void {
	const values: Record<string, string | number | boolean | undefined> = {}

	// Base Station Info
	values['base_station_state'] = self.state.basestation.state?.state
	values['base_station_name'] = self.state.basestation.site?.deviceName
	values['base_station_location'] = self.state.basestation.site?.location
	values['base_station_position'] = self.state.basestation.site?.position
	values['base_station_model'] = self.state.basestation.identity?.product
	values['base_station_serial'] = self.state.basestation.identity?.serial
	values['base_station_version'] = self.state.basestation.identity?.hardwareRevision
	values['base_station_warnings'] = self.state.basestation.state?.warnings?.length
		? self.state.basestation.state?.warnings?.join(', ')
		: 'None'

	// Health
	values['health_psu_1_state'] = psuStatusLabels[self.state.health.psu.psu1]
	values['health_psu_2_state'] = psuStatusLabels[self.state.health.psu.psu2]
	values['health_temp_state'] = self.state.health.temp.value
	values['health_fan_1_error'] = self.state.health.fans['FAN_1']?.errorState.value
	values['health_fan_2_error'] = self.state.health.fans['FAN_2']?.errorState.value
	values['health_fan_3_error'] = self.state.health.fans['FAN_3']?.errorState.value

	// Audio Inputs
	for (const input of self.state.audioInputs.values()) {
		values[`audio_input_${input.inputId}_source`] = input.source
		values[`audio_input_${input.inputId}_name`] = input.name
		values[`audio_input_${input.inputId}_iem_link_id`] = input.iemAudiolinkId
	}

	// Audio Outputs
	for (const output of self.state.audioOutputs.values()) {
		values[`audio_output_${output.outputId}_mic_link`] = output.micAudiolinkId
	}

	// RF Channels
	for (const channel of self.state.rfChannels.values()) {
		const displayId = channel.rfChannelId + 1
		values[`rf_channel_${displayId}_tx_power`] = channel.txPower
		values[`rf_channel_${displayId}_frequency`] = channel.frequency / 1000
		values[`rf_channel_${displayId}_bandwidth_mode`] = channel.bandwidthMode
		values[`rf_channel_${displayId}_rf_restriction_violation`] = channel.rfRestrictionViolation
		values[`rf_channel_${displayId}_state`] = channel.rfState === RfState.Active ? 'Active' : 'Muted'
		values[`rf_channel_${displayId}_startup_state`] = channel.rfStateOnStartup
			? rfStateStartupLabels[channel.rfStateOnStartup]
			: 'Unknown'
	}

	// Antennas
	for (const antenna of self.state.antennas.values()) {
		const port = sanitizeName(antenna.antennaPortId)
		values[`dad_${port}_state`] = antenna.state
		values[`dad_${port}_type`] = antenna.type
		values[`dad_${port}_error_details`] = antenna.errorStateDetails
		values[`dad_${port}_high_temp_warning`] = antenna.warningHighTemperature
		values[`dad_${port}_packet_error_warning`] = antenna.warningPacketError
		values[`dad_${port}_temperature`] = antenna.temperature
		values[`dad_${port}_type`] = antenna.type
		values[`dad_${port}_version`] = antenna.version
		values[`dad_${port}_identify`] = antenna.identify
		values[`dad_${port}_led_brightness`] = antenna.ledBrightness
		const binding = antenna.bindings[0]?.binding
		const bindingLabel = Object.keys(RFChannels).find((key) => RFChannels[key as keyof typeof RFChannels] === binding)
		values[`dad_${port}_bindings`] = bindingLabel ?? 'None'
		values[`dad_${port}_mismatch`] = antenna.bindings[0]?.mismatch
	}

	// Mobile Devices
	for (const device of self.state.mobileDevices.values()) {
		const name = sanitizeName(device.name)
		const type = device.type
		const serial = device.serial

		const deviceVariableId = `${type}_${name}_${serial}`
		values[`${deviceVariableId}_mt_uid`] = device.mtUid
		values[`${deviceVariableId}_mt_type`] = device.type
		values[`${deviceVariableId}_frequency_range`] = device.frequencyRange
		values[`${deviceVariableId}_rf_channel_id`] = device.rfChannelId
		values[`${deviceVariableId}_identify`] = device.identify
		values[`${deviceVariableId}_reverse_identify`] = device.reverseIdentify
		values[`${deviceVariableId}_serial`] = device.serial
		values[`${deviceVariableId}_connected`] = device.connected
		values[`${deviceVariableId}_sleep`] = device.sleep
		values[`${deviceVariableId}_state`] = device.state
		values[`${deviceVariableId}_battery_level`] = device.batteryFillLevel === -1 ? 'OFF' : device.batteryFillLevel
		values[`${deviceVariableId}_battery_runtime`] = device.batteryRuntime === -1 ? 'OFF' : device.batteryRuntime
		values[`${deviceVariableId}_battery_low`] = device.batteryLow
		values[`${deviceVariableId}_version`] = device.version
		values[`${deviceVariableId}_version_mismatch`] = device.versionMismatch
		values[`${deviceVariableId}_fcc_id`] = device.fccId
		values[`${deviceVariableId}_led_brightness`] = device.ledBrightness
		values[`${deviceVariableId}_sw_update_possible`] = device.swUpdatePossible
		values[`${deviceVariableId}_sw_update_progress`] = device.swUpdateProgress
		values[`${deviceVariableId}_mic_audiolink_id`] = device.micAudiolinkId
		values[`${deviceVariableId}_mic_audiolink_active`] = device.micAudiolinkActive
		values[`${deviceVariableId}_mic_test_tone_enabled`] = device.micTestToneEnabled
		values[`${deviceVariableId}_mic_test_tone_level`] = device.micTestToneLevel
		values[`${deviceVariableId}_command_state`] = device.commandState
		values[`${deviceVariableId}_mic_lqi`] = device.micLqi
		values[`${deviceVariableId}_interference`] = device.interference?.severity
		values[`${deviceVariableId}_dominant_antenna`] = device.dominantAntenna
		values[`${deviceVariableId}_rssi`] = device.rssi

		if (device.type === MtType.SEK) {
			values[`${deviceVariableId}_headphone_volume`] = device.headphoneVolume
			values[`${deviceVariableId}_headphone_balance`] = device.headphoneBalance
			values[`${deviceVariableId}_mic_preamp_gain`] = device.micPreampGain
			values[`${deviceVariableId}_mic_lowcut_hz`] = device.micLowCutHz
			values[`${deviceVariableId}_iem_audiolink_id`] = device.iemAudiolinkId
			values[`${deviceVariableId}_iem_audiolink_active`] = device.iemAudiolinkActive
			values[`${deviceVariableId}_headphone_plug_state`] = device.headphonePlugState
			values[`${deviceVariableId}_headphone_volume_max`] = device.headphoneVolumeMax
			values[`${deviceVariableId}_headphone_volume_min`] = device.headphoneVolumeMin
			values[`${deviceVariableId}_mic_line_selection`] = device.micLineSelection
			values[`${deviceVariableId}_mic_line_selection_auto_value`] = device.micLineSelectionAutoValue
			values[`${deviceVariableId}_cable_emulation`] = device.cableEmulation
			values[`${deviceVariableId}_iem_lqi`] = device.iemLqi
		} else if (device.type === MtType.SKM) {
			values[`${deviceVariableId}_mic_preamp_gain`] = device.micPreampGain
			values[`${deviceVariableId}_mic_lowcut_hz`] = device.micLowCutHz
			values[`${deviceVariableId}_command_behavior`] = device.commandBehavior
			values[`${deviceVariableId}_mic_module`] = device.micModule
		}
	}

	self.setVariableValues(values)
}
