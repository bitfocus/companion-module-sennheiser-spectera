import type { SpecteraInstance } from './main.js'
import { MtType, RfState, RFChannels, RfStateStartup } from './types.js'

const rfStateStartupLabels: Record<RfStateStartup, string> = {
	[RfStateStartup.Active]: 'Active',
	[RfStateStartup.Muted]: 'Muted',
	[RfStateStartup.LastState]: 'Last State',
}

function sanitizeName(name: string): string {
	return name.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function UpdateVariableDefinitions(self: SpecteraInstance): void {
	const variables: { variableId: string; name: string }[] = [
		// Basestation Info
		{ variableId: 'basestation_state', name: 'Basestation - State' },
		{ variableId: 'basestation_name', name: 'Basestation - Name' },
		{ variableId: 'basestation_location', name: 'Basestation - Location' },
		{ variableId: 'basestation_position', name: 'Basestation - Position' },
		{ variableId: 'basestation_model', name: 'Basestation - Product Model' },
		{ variableId: 'basestation_serial', name: 'Basestation - Serial Number' },
		{ variableId: 'basestation_version', name: 'Basestation - Version' },

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
				name: `RF Channel ${displayId} - Frequency`,
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

	// Antennas
	for (const antenna of self.state.antennas.values()) {
		const port = sanitizeName(antenna.antennaPortId)
		variables.push(
			{
				variableId: `antenna_${port}_state`,
				name: `Antenna ${antenna.antennaPortId} - State`,
			},
			{
				variableId: `antenna_${port}_type`,
				name: `Antenna ${antenna.antennaPortId} - Type`,
			},
			{
				variableId: `antenna_${port}_error_details`,
				name: `Antenna ${antenna.antennaPortId} - Error Details`,
			},
			{
				variableId: `antenna_${port}_high_temp_warning`,
				name: `Antenna ${antenna.antennaPortId} - High Temperature Warning`,
			},
			{
				variableId: `antenna_${port}_packet_error_warning`,
				name: `Antenna ${antenna.antennaPortId} - Packet Error Warning`,
			},
			{
				variableId: `antenna_${port}_temperature`,
				name: `Antenna ${antenna.antennaPortId} - Temperature`,
			},
			{
				variableId: `antenna_${port}_type`,
				name: `Antenna ${antenna.antennaPortId} - Type`,
			},
			{
				variableId: `antenna_${port}_version`,
				name: `Antenna ${antenna.antennaPortId} - Version`,
			},
			{
				variableId: `antenna_${port}_identify`,
				name: `Antenna ${antenna.antennaPortId} - Identify`,
			},
			{
				variableId: `antenna_${port}_led_brightness`,
				name: `Antenna ${antenna.antennaPortId} - LED Brightness`,
			},
			{
				variableId: `antenna_${port}_bindings`,
				name: `Antenna ${antenna.antennaPortId} - Bindings`,
			},
			{
				variableId: `antenna_${port}_mismatch`,
				name: `Antenna ${antenna.antennaPortId} - Mismatch`,
			},
		)
	}

	// Mobile Devices
	for (const device of self.state.mobileDevices.values()) {
		const name = sanitizeName(device.name)
		variables.push(
			{
				variableId: `mobile_device_${name}_mt_uid`,
				name: `Mobile Device ${device.name} - MT UID`,
			},
			{
				variableId: `mobile_device_${name}_mt_type`,
				name: `Mobile Device ${device.name} - MT Type`,
			},
			{
				variableId: `mobile_device_${name}_frequency_range`,
				name: `Mobile Device ${device.name} - Frequency Range`,
			},
			{
				variableId: `mobile_device_${name}_rf_channel_id`,
				name: `Mobile Device ${device.name} - RF Channel ID`,
			},
			{
				variableId: `mobile_device_${name}_identify`,
				name: `Mobile Device ${device.name} - Identify`,
			},
			{
				variableId: `mobile_device_${name}_reverse_identify`,
				name: `Mobile Device ${device.name} - Reverse Identify`,
			},
			{
				variableId: `mobile_device_${name}_serial`,
				name: `Mobile Device ${device.name} - Serial`,
			},
			{
				variableId: `mobile_device_${name}_connected`,
				name: `Mobile Device ${device.name} - Connected`,
			},
			{
				variableId: `mobile_device_${name}_sleep`,
				name: `Mobile Device ${device.name} - Sleep`,
			},
			{
				variableId: `mobile_device_${name}_state`,
				name: `Mobile Device ${device.name} - State`,
			},
			{
				variableId: `mobile_device_${name}_last_connected`,
				name: `Mobile Device ${device.name} - Last Connected`,
			},
			{
				variableId: `mobile_device_${name}_battery_level`,
				name: `Mobile Device ${device.name} - Battery Level`,
			},
			{
				variableId: `mobile_device_${name}_battery_runtime`,
				name: `Mobile Device ${device.name} - Battery Runtime`,
			},
			{
				variableId: `mobile_device_${name}_battery_low`,
				name: `Mobile Device ${device.name} - Battery Low`,
			},
			{
				variableId: `mobile_device_${name}_version`,
				name: `Mobile Device ${device.name} - Version`,
			},
			{
				variableId: `mobile_device_${name}_version_mismatch`,
				name: `Mobile Device ${device.name} - Version Mismatch`,
			},
			{
				variableId: `mobile_device_${name}_fcc_id`,
				name: `Mobile Device ${device.name} - FCC ID`,
			},
			{
				variableId: `mobile_device_${name}_led_brightness`,
				name: `Mobile Device ${device.name} - LED Brightness`,
			},
			{
				variableId: `mobile_device_${name}_sw_update_possible`,
				name: `Mobile Device ${device.name} - SW Update Possible`,
			},
			{
				variableId: `mobile_device_${name}_sw_update_progress`,
				name: `Mobile Device ${device.name} - SW Update Progress`,
			},
			{
				variableId: `mobile_device_${name}_mic_audiolink_id`,
				name: `Mobile Device ${device.name} - Mic AudioLink ID`,
			},
			{
				variableId: `mobile_device_${name}_mic_audiolink_active`,
				name: `Mobile Device ${device.name} - Mic AudioLink Active`,
			},
			{
				variableId: `mobile_device_${name}_mic_test_tone_enabled`,
				name: `Mobile Device ${device.name} - Mic Test Tone Enabled`,
			},
			{
				variableId: `mobile_device_${name}_mic_test_tone_level`,
				name: `Mobile Device ${device.name} - Mic Test Tone Level`,
			},
			{
				variableId: `mobile_device_${name}_command_state`,
				name: `Mobile Device ${device.name} - Command State`,
			},
			{
				variableId: `mobile_device_${name}_mic_lqi`,
				name: `Mobile Device ${device.name} - Mic LQI`,
			},
			{
				variableId: `mobile_device_${name}_interference`,
				name: `Mobile Device ${device.name} - Interference`,
			},
			{
				variableId: `mobile_device_${name}_dominant_antenna`,
				name: `Mobile Device ${device.name} - Dominant Antenna`,
			},
			{
				variableId: `mobile_device_${name}_rssi`,
				name: `Mobile Device ${device.name} - RSSI`,
			},
		)

		// Type specific
		if (device.type === MtType.SEK) {
			variables.push(
				{
					variableId: `mobile_device_${name}_headphone_volume`,
					name: `Mobile Device ${device.name} - Headphone Volume`,
				},
				{
					variableId: `mobile_device_${name}_headphone_balance`,
					name: `Mobile Device ${device.name} - Headphone Balance`,
				},
				{
					variableId: `mobile_device_${name}_mic_preamp_gain`,
					name: `Mobile Device ${device.name} - Mic Preamp Gain`,
				},
				{
					variableId: `mobile_device_${name}_mic_lowcut_hz`,
					name: `Mobile Device ${device.name} - Mic Lowcut Hz`,
				},
				{
					variableId: `mobile_device_${name}_iem_audiolink_id`,
					name: `Mobile Device ${device.name} - IEM AudioLink ID`,
				},
				{
					variableId: `mobile_device_${name}_iem_audiolink_active`,
					name: `Mobile Device ${device.name} - IEM AudioLink Active`,
				},
				{
					variableId: `mobile_device_${name}_headphone_plug_state`,
					name: `Mobile Device ${device.name} - Headphone Plug State`,
				},
				{
					variableId: `mobile_device_${name}_headphone_volume_max`,
					name: `Mobile Device ${device.name} - Headphone Volume Max`,
				},
				{
					variableId: `mobile_device_${name}_headphone_volume_min`,
					name: `Mobile Device ${device.name} - Headphone Volume Min`,
				},
				{
					variableId: `mobile_device_${name}_mic_line_selection`,
					name: `Mobile Device ${device.name} - Mic/Line Selection`,
				},
				{
					variableId: `mobile_device_${name}_mic_line_selection_auto_value`,
					name: `Mobile Device ${device.name} - Mic/Line Selection Auto Value`,
				},
				{
					variableId: `mobile_device_${name}_cable_emulation`,
					name: `Mobile Device ${device.name} - Cable Emulation`,
				},
				{
					variableId: `mobile_device_${name}_iem_lqi`,
					name: `Mobile Device ${device.name} - IEM LQI`,
				},
			)
		} else if (device.type === MtType.SKM) {
			variables.push(
				{
					variableId: `mobile_device_${name}_mic_preamp_gain`,
					name: `Mobile Device ${device.name} - Mic Preamp Gain`,
				},
				{
					variableId: `mobile_device_${name}_mic_lowcut_hz`,
					name: `Mobile Device ${device.name} - Mic Lowcut Hz`,
				},
				{
					variableId: `mobile_device_${name}_command_behavior`,
					name: `Mobile Device ${device.name} - Command Behavior`,
				},
				{
					variableId: `mobile_device_${name}_mic_module`,
					name: `Mobile Device ${device.name} - Mic Module`,
				},
			)
		}
	}

	self.setVariableDefinitions(variables)
}

export function UpdateVariableValues(self: SpecteraInstance): void {
	const values: Record<string, string | number | boolean | undefined> = {}

	// Basestation Info
	values['basestation_state'] = self.state.deviceInfo.state?.state
	values['basestation_name'] = self.state.deviceInfo.site?.deviceName
	values['basestation_location'] = self.state.deviceInfo.site?.location
	values['basestation_position'] = self.state.deviceInfo.site?.position
	values['basestation_model'] = self.state.deviceInfo.identity?.product
	values['basestation_serial'] = self.state.deviceInfo.identity?.serial
	values['basestation_version'] = self.state.deviceInfo.identity?.hardwareRevision

	// Health
	values['health_psu_1_state'] = self.state.health.psu.psu1
	values['health_psu_2_state'] = self.state.health.psu.psu2
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
		values[`rf_channel_${displayId}_frequency`] = channel.frequency
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
		values[`antenna_${port}_state`] = antenna.state
		values[`antenna_${port}_type`] = antenna.type
		values[`antenna_${port}_error_details`] = antenna.errorStateDetails
		values[`antenna_${port}_high_temp_warning`] = antenna.warningHighTemperature
		values[`antenna_${port}_packet_error_warning`] = antenna.warningPacketError
		values[`antenna_${port}_temperature`] = antenna.temperature
		values[`antenna_${port}_type`] = antenna.type
		values[`antenna_${port}_version`] = antenna.version
		values[`antenna_${port}_identify`] = antenna.identify
		values[`antenna_${port}_led_brightness`] = antenna.ledBrightness
		const binding = antenna.bindings[0]?.binding
		const bindingLabel = Object.keys(RFChannels).find((key) => RFChannels[key as keyof typeof RFChannels] === binding)
		values[`antenna_${port}_bindings`] = bindingLabel ?? 'None'
		values[`antenna_${port}_mismatch`] = antenna.bindings[0]?.mismatch
	}

	// Mobile Devices
	for (const device of self.state.mobileDevices.values()) {
		const name = sanitizeName(device.name)
		values[`mobile_device_${name}_mt_uid`] = device.mtUid
		values[`mobile_device_${name}_mt_type`] = device.type
		values[`mobile_device_${name}_frequency_range`] = device.frequencyRange
		values[`mobile_device_${name}_rf_channel_id`] = device.rfChannelId
		values[`mobile_device_${name}_identify`] = device.identify
		values[`mobile_device_${name}_reverse_identify`] = device.reverseIdentify
		values[`mobile_device_${name}_serial`] = device.serial
		values[`mobile_device_${name}_connected`] = device.connected
		values[`mobile_device_${name}_sleep`] = device.sleep
		values[`mobile_device_${name}_state`] = device.state
		values[`mobile_device_${name}_battery_level`] = device.batteryFillLevel === -1 ? 'OFF' : device.batteryFillLevel
		values[`mobile_device_${name}_battery_runtime`] = device.batteryRuntime === -1 ? 'OFF' : device.batteryRuntime
		values[`mobile_device_${name}_battery_low`] = device.batteryLow
		values[`mobile_device_${name}_version`] = device.version
		values[`mobile_device_${name}_version_mismatch`] = device.versionMismatch
		values[`mobile_device_${name}_fcc_id`] = device.fccId
		values[`mobile_device_${name}_led_brightness`] = device.ledBrightness
		values[`mobile_device_${name}_sw_update_possible`] = device.swUpdatePossible
		values[`mobile_device_${name}_sw_update_progress`] = device.swUpdateProgress
		values[`mobile_device_${name}_mic_audiolink_id`] = device.micAudiolinkId
		values[`mobile_device_${name}_mic_audiolink_active`] = device.micAudiolinkActive
		values[`mobile_device_${name}_mic_test_tone_enabled`] = device.micTestToneEnabled
		values[`mobile_device_${name}_mic_test_tone_level`] = device.micTestToneLevel
		values[`mobile_device_${name}_command_state`] = device.commandState
		values[`mobile_device_${name}_mic_lqi`] = device.micLqi
		values[`mobile_device_${name}_interference`] = device.interference?.severity
		values[`mobile_device_${name}_dominant_antenna`] = device.dominantAntenna
		values[`mobile_device_${name}_rssi`] = device.rssi

		if (device.type === MtType.SEK) {
			values[`mobile_device_${name}_headphone_volume`] = device.headphoneVolume
			values[`mobile_device_${name}_headphone_balance`] = device.headphoneBalance
			values[`mobile_device_${name}_mic_preamp_gain`] = device.micPreampGain
			values[`mobile_device_${name}_mic_lowcut_hz`] = device.micLowCutHz
			values[`mobile_device_${name}_iem_audiolink_id`] = device.iemAudiolinkId
			values[`mobile_device_${name}_iem_audiolink_active`] = device.iemAudiolinkActive
			values[`mobile_device_${name}_headphone_plug_state`] = device.headphonePlugState
			values[`mobile_device_${name}_headphone_volume_max`] = device.headphoneVolumeMax
			values[`mobile_device_${name}_headphone_volume_min`] = device.headphoneVolumeMin
			values[`mobile_device_${name}_mic_line_selection`] = device.micLineSelection
			values[`mobile_device_${name}_mic_line_selection_auto_value`] = device.micLineSelectionAutoValue
			values[`mobile_device_${name}_cable_emulation`] = device.cableEmulation
			values[`mobile_device_${name}_iem_lqi`] = device.iemLqi
		} else if (device.type === MtType.SKM) {
			values[`mobile_device_${name}_mic_preamp_gain`] = device.micPreampGain
			values[`mobile_device_${name}_mic_lowcut_hz`] = device.micLowCutHz
			values[`mobile_device_${name}_command_behavior`] = device.commandBehavior
			values[`mobile_device_${name}_mic_module`] = device.micModule
		}
	}

	self.setVariableValues(values)
}
