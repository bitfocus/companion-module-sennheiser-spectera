import type {
	RfChannel,
	Antenna,
	PsuState,
	BaseStationState,
	AudioInput,
	AudioOutput,
	TempState,
	FanState,
	BaseStationIdentity,
	BaseStationSite,
	AntennaBinding,
	SEKDevice,
	SKMDevice,
	AudioLink,
	InterfaceStatusAudioNetwork,
	InterfaceStatusMadi,
	InterfaceStatusWordclock,
} from './types.js'
import {
	RfState,
	RfStateStartup,
	RFChannels,
	PsuStatus,
	AudiolinkModeId,
	MicLowCutHzSEK,
	MicLowCutHzSKM,
	MtType,
} from './types.js'

export interface StateMapEntry<T> {
	feedback?: string
	variable?: string // suffix
	valueFn?: (val: any, state: T) => string | number | boolean | undefined
}

export type StateMap<T> = Partial<Record<keyof T, StateMapEntry<T>>>

// Helper transformers
const toTxPower = (v: unknown): any => v
const toFrequency = (v: unknown): any => (v as number) / 1000
const toStateLabel = (v: unknown): any => (v === RfState.Active ? 'Active' : 'Muted')
const toStartupStateLabel = (v: unknown): any =>
	v ? (v === RfStateStartup.Active ? 'Active' : v === RfStateStartup.Muted ? 'Muted' : 'Last State') : 'Unknown'
const toBindingLabel = (v: unknown): any => {
	const binding = (v as AntennaBinding[])?.[0]?.binding
	return Object.keys(RFChannels).find((key) => RFChannels[key as keyof typeof RFChannels] === binding) ?? 'None'
}
const toAudioLinkModeLabel = (v: unknown): any => AudiolinkModeId[v as number] ?? 'Unknown'
const toMicLowCutLabel = (v: unknown, state: SEKDevice | SKMDevice): string | number => {
	if (state.type === MtType.SEK) {
		return v === MicLowCutHzSEK.Off ? 'Off' : (v as number)
	} else if (state.type === MtType.SKM) {
		return v === MicLowCutHzSKM.Off ? 'Off' : (v as number)
	}
	return v as number
}

const psuStatusLabels: Record<PsuStatus, string> = {
	[PsuStatus.Connected]: 'Connected',
	[PsuStatus.Unconnected]: 'Unconnected',
	[PsuStatus.Disconnected]: 'Disconnected',
}
const toPsuLabel = (v: unknown): any => psuStatusLabels[v as PsuStatus]
const joinWarnings = (v: unknown): any => ((v as string[])?.length ? (v as string[]).join(', ') : 'None')

export const RfChannelStateMap: StateMap<RfChannel> = {
	txPower: { feedback: 'rfTxPower', variable: 'tx_power', valueFn: toTxPower },
	frequency: { feedback: 'rfFrequency', variable: 'frequency', valueFn: toFrequency },
	bandwidthMode: { feedback: 'rfBandwidthMode', variable: 'bandwidth_mode', valueFn: (v: unknown): any => v },
	rfRestrictionViolation: {
		feedback: 'rfRestrictionViolation',
		variable: 'rf_restriction_violation',
		valueFn: (v: unknown): any => v,
	},
	rfState: { feedback: 'rfState', variable: 'state', valueFn: toStateLabel },
	rfStateOnStartup: { feedback: 'rfStateOnStartup', variable: 'startup_state', valueFn: toStartupStateLabel },
}

export const AntennaStateMap: StateMap<Antenna> = {
	state: { feedback: 'dadState', variable: 'state', valueFn: (v: unknown): any => v },
	type: { variable: 'type', valueFn: (v: unknown): any => v },
	errorStateDetails: { variable: 'error_details', valueFn: (v: unknown): any => v },
	warningHighTemperature: {
		feedback: 'dadWarningHighTemperature',
		variable: 'high_temp_warning',
		valueFn: (v: unknown): any => v,
	},
	warningPacketError: {
		feedback: 'dadWarningPacketError',
		variable: 'packet_error_warning',
		valueFn: (v: unknown): any => v,
	},
	temperature: { feedback: 'dadTemperature', variable: 'temperature', valueFn: (v: unknown): any => v },
	version: { variable: 'version', valueFn: (v: unknown): any => v },
	identify: { feedback: 'dadIdenitify', variable: 'identify', valueFn: (v: unknown): any => v },
	ledBrightness: { feedback: 'dadLedBrightness', variable: 'led_brightness', valueFn: (v: unknown): any => v },
	bindings: { feedback: 'dadBindings', variable: 'bindings', valueFn: toBindingLabel },
}

export const AudioInputStateMap: StateMap<AudioInput> = {
	source: { variable: 'source', valueFn: (v: unknown): any => v },
	name: { variable: 'name', valueFn: (v: unknown): any => v },
	iemAudiolinkId: { feedback: 'iemAudioInputLinked', variable: 'iem_link_id', valueFn: (v: unknown): any => v },
}

export const AudioOutputStateMap: StateMap<AudioOutput> = {
	micAudiolinkId: { variable: 'mic_link_id', valueFn: (v: unknown): any => v },
}

export const MobileDeviceStateMap: StateMap<SEKDevice & SKMDevice> = {
	mtUid: { variable: 'mt_uid', valueFn: (v: unknown): any => v },
	type: { variable: 'mt_type', valueFn: (v: unknown): any => v },
	frequencyRange: {
		feedback: 'mobileDeviceFrequencyRange',
		variable: 'frequency_range',
		valueFn: (v: unknown): any => v,
	},
	rfChannelId: { feedback: 'mobileDeviceRfChannelId', variable: 'rf_channel_id', valueFn: (v: unknown): any => v },
	identify: { feedback: 'mobileDeviceIdentify', variable: 'identify', valueFn: (v: unknown): any => v },
	reverseIdentify: {
		feedback: 'mobileDeviceReverseIdentify',
		variable: 'reverse_identify',
		valueFn: (v: unknown): any => v,
	},
	serial: { variable: 'serial', valueFn: (v: unknown): any => v },
	connected: { feedback: 'mobileDeviceConnected', variable: 'connected', valueFn: (v: unknown): any => v },
	lastConnected: {
		feedback: 'mobileDeviceLastConnected',
		variable: 'last_connected',
		valueFn: (v: unknown): any => v,
	},
	sleep: { feedback: 'mobileDeviceSleep', variable: 'sleep', valueFn: (v: unknown): any => v },
	state: { feedback: 'mobileDeviceState', variable: 'state', valueFn: (v: unknown): any => v },
	batteryFillLevel: {
		feedback: 'mobileDeviceBatteryLevel',
		variable: 'battery_level',
		valueFn: (v: unknown): any => (v === -1 ? 'Off' : v),
	},
	batteryRuntime: {
		feedback: 'mobileDeviceBatteryRuntime',
		variable: 'battery_runtime',
		valueFn: (v: unknown): any => (v === -1 ? 'Off' : v),
	},
	batteryLow: { feedback: 'mobileDeviceBatteryLow', variable: 'battery_low', valueFn: (v: unknown): any => v },
	version: { variable: 'version', valueFn: (v: unknown): any => v },
	versionMismatch: { variable: 'version_mismatch', valueFn: (v: unknown): any => v },
	fccId: { variable: 'fcc_id', valueFn: (v: unknown): any => v },
	ledBrightness: {
		feedback: 'mobileDeviceLedBrightness',
		variable: 'led_brightness',
		valueFn: (v: unknown): any => v,
	},
	swUpdatePossible: { variable: 'sw_update_possible', valueFn: (v: unknown): any => v },
	swUpdateProgress: { variable: 'sw_update_progress', valueFn: (v: unknown): any => v },
	micAudiolinkId: {
		feedback: 'mobileDeviceMicAudiolinkId',
		variable: 'mic_audiolink_id',
		valueFn: (v: unknown): any => v,
	},
	micAudiolinkActive: {
		feedback: 'mobileDeviceMicAudiolinkActive',
		variable: 'mic_audiolink_active',
		valueFn: (v: unknown): any => v,
	},
	micTestToneEnabled: {
		feedback: 'mobileDeviceMicTestToneEnabled',
		variable: 'mic_test_tone_enabled',
		valueFn: (v: unknown): any => v,
	},
	micTestToneLevel: {
		feedback: 'mobileDeviceMicTestToneLevel',
		variable: 'mic_test_tone_level',
		valueFn: (v: unknown): any => v,
	},
	commandState: { variable: 'command_state', valueFn: (v: unknown): any => v },
	micLqi: { variable: 'mic_lqi', valueFn: (v: unknown): any => v },
	interference: {
		feedback: 'mobileDeviceInterference',
		variable: 'interference',
		valueFn: (v: unknown): any => (v as any)?.severity,
	},
	dominantAntenna: {
		feedback: 'mobileDeviceDominantAntenna',
		variable: 'dominant_antenna',
		valueFn: (v: unknown): any => (typeof v === 'string' && v !== 'NotAvailable' ? v.toUpperCase() : 'Not Available'),
	},
	rssi: { variable: 'rssi', valueFn: (v: unknown): any => v },
	// SEK specific
	headphoneVolume: {
		feedback: 'mobileDeviceHeadphoneVolume',
		variable: 'headphone_volume',
		valueFn: (v: unknown): any => v,
	},
	headphoneBalance: {
		feedback: 'mobileDeviceHeadphoneBalance',
		variable: 'headphone_balance',
		valueFn: (v: unknown): any => v,
	},
	micPreampGain: {
		feedback: 'mobileDeviceMicPreampGain',
		variable: 'mic_preamp_gain',
		valueFn: (v: unknown): any => v,
	},
	micLowCutHz: {
		feedback: 'mobileDeviceMicLowCutHz',
		variable: 'mic_lowcut_hz',
		valueFn: toMicLowCutLabel,
	},
	iemAudiolinkId: { feedback: 'iemAudioInputLinked', variable: 'iem_audiolink_id', valueFn: (v: unknown): any => v },
	iemAudiolinkActive: {
		feedback: 'iemAudioLinkActive',
		variable: 'iem_audiolink_active',
		valueFn: (v: unknown): any => v,
	},
	headphonePlugState: {
		feedback: 'mobileDeviceHeadphonePlugState',
		variable: 'headphone_plug_state',
		valueFn: (v: unknown): any => (v === 'NotAvailable' ? 'Not Available' : v),
	},
	headphoneVolumeMax: {
		feedback: 'mobileDeviceHeadphoneVolumeMax',
		variable: 'headphone_volume_max',
		valueFn: (v: unknown): any => v,
	},
	headphoneVolumeMin: {
		feedback: 'mobileDeviceHeadphoneVolumeMin',
		variable: 'headphone_volume_min',
		valueFn: (v: unknown): any => v,
	},
	micLineSelection: {
		feedback: 'mobileDeviceMicLineSelection',
		variable: 'mic_line_selection',
		valueFn: (v: unknown): any => v,
	},
	micLineSelectionAutoValue: {
		feedback: 'mobileDeviceMicLineSelectionAutoValue',
		variable: 'mic_line_selection_auto_value',
		valueFn: (v: unknown): any => v,
	},
	cableEmulation: {
		feedback: 'mobileDeviceCableEmulation',
		variable: 'cable_emulation',
		valueFn: (v: unknown): any => v,
	},
	iemLqi: { variable: 'iem_lqi', valueFn: (v: unknown): any => v },
	// SKM specific
	commandBehavior: { variable: 'command_behavior', valueFn: (v: unknown): any => v },
	micModule: { variable: 'mic_module', valueFn: (v: unknown): any => (v as any)?.name },
}

export const PsuStateMap: StateMap<PsuState> = {
	psu1: { feedback: 'baseStationPsu', variable: 'health_psu_1_state', valueFn: toPsuLabel },
	psu2: { feedback: 'baseStationPsu', variable: 'health_psu_2_state', valueFn: toPsuLabel },
}

// Special case: Fan state is dynamic per fan ID, variables are constructed manually in helper if needed or key mapping
// For fans, value is FanState.
export const FanStateMap: StateMap<FanState> = {
	errorState: { variable: 'error', valueFn: (v: unknown): any => (v as any).value },
}

export const TempStateMap: StateMap<TempState> = {
	value: { variable: 'health_temp_state', valueFn: (v: unknown): any => v },
}

export const BaseStationIdentityMap: StateMap<BaseStationIdentity> = {
	product: { variable: 'base_station_model', valueFn: (v: unknown): any => v },
	serial: { variable: 'base_station_serial', valueFn: (v: unknown): any => v },
	hardwareRevision: { variable: 'base_station_version', valueFn: (v: unknown): any => v },
}

export const BaseStationStateMap: StateMap<BaseStationState> = {
	state: { feedback: 'baseStationState', variable: 'base_station_state', valueFn: (v: unknown): any => v },
	warnings: { feedback: 'baseStationWarnings', variable: 'base_station_warnings', valueFn: joinWarnings },
}

export const BaseStationSiteMap: StateMap<BaseStationSite> = {
	deviceName: { variable: 'base_station_name', valueFn: (v: unknown): any => v },
	location: { variable: 'base_station_location', valueFn: (v: any): any => v },
	position: { variable: 'base_station_position', valueFn: (v: any): any => v },
}

export const AudioLinkStateMap: StateMap<AudioLink> = {
	audiolinkId: { variable: 'id', valueFn: (v: unknown): any => v },
	rfChannelId: { variable: 'rf_channel_id', valueFn: (v: unknown): any => v },
	modeId: { variable: 'mode', valueFn: toAudioLinkModeLabel },
}

export const AudioNetworkStateMap: StateMap<InterfaceStatusAudioNetwork> = {
	status: { feedback: 'audioInterfaceStatus', variable: 'status', valueFn: (v: unknown): any => v },
	sampleRateHz: { variable: 'sample_rate', valueFn: (v: unknown): any => v },
	mute: { variable: 'mute', valueFn: (v: unknown): any => v },
}

export const MadiStateMap: StateMap<Pick<InterfaceStatusMadi, 'moduleType'>> = {
	moduleType: { variable: 'module_type', valueFn: (v: unknown): any => v },
}

export const MadiInputStateMap: StateMap<InterfaceStatusMadi['inputStatus']> = {
	status: { feedback: 'audioInterfaceStatus', variable: 'input_status', valueFn: (v: unknown): any => v },
	sampleRateHz: { variable: 'input_sample_rate', valueFn: (v: unknown): any => v },
	mute: { variable: 'input_mute', valueFn: (v: unknown): any => v },
	channels: { variable: 'input_channels', valueFn: (v: unknown): any => v },
	fewerChannelsThanUsed: { variable: 'input_fewer_channels_than_used', valueFn: (v: unknown): any => v },
}

export const MadiOutputStateMap: StateMap<InterfaceStatusMadi['outputStatus']> = {
	clockSource: { variable: 'output_clock_source', valueFn: (v: unknown): any => v },
	clockSourceStatus: {
		feedback: 'audioInterfaceStatus',
		variable: 'output_clock_source_status',
		valueFn: (v: unknown): any => v,
	},
	fallbackToInternalClockActive: { variable: 'output_fallback_active', valueFn: (v: unknown): any => v },
	sampleRateHz: { variable: 'output_sample_rate', valueFn: (v: unknown): any => v },
	mute: { variable: 'output_mute', valueFn: (v: unknown): any => v },
	channels: { variable: 'output_channels', valueFn: (v: unknown): any => v },
}

export const WordclockInputStateMap: StateMap<InterfaceStatusWordclock['inputStatus']> = {
	status: { feedback: 'audioInterfaceStatus', variable: 'input_status', valueFn: (v: unknown): any => v },
	sampleRateHz: { variable: 'input_sample_rate', valueFn: (v: unknown): any => v },
}

export const WordclockOutputStateMap: StateMap<InterfaceStatusWordclock['outputStatus']> = {
	clockSource: { variable: 'output_clock_source', valueFn: (v: unknown): any => v },
	clockSourceStatus: {
		feedback: 'audioInterfaceStatus',
		variable: 'output_clock_source_status',
		valueFn: (v: unknown): any => v,
	},
	fallbackToInternalClockActive: { variable: 'output_fallback_active', valueFn: (v: unknown): any => v },
	sampleRateHz: { variable: 'output_sample_rate', valueFn: (v: unknown): any => v },
}
