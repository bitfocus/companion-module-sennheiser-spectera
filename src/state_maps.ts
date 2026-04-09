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
	InterferenceDetail,
	MicModule,
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
	InputSource,
} from './types.js'
import { formatBatteryRuntimeMinutes } from './utils.js'

export type VariableValue = string | number | boolean | undefined

export interface StateMapEntry<T> {
	feedback?: string | string[]
	variable?: string // suffix
	/** Multiple Companion variables from one field (suffixes appended to the instance prefix). */
	variableSuffixes?: Array<{ suffix: string; valueFn: (val: unknown, state: T) => VariableValue }>
	valueFn?: (val: unknown, state: T) => VariableValue
}

export type StateMap<T> = Partial<Record<keyof T, StateMapEntry<T>>>

/** Identity transform — passes the value through unchanged. */
const passthrough = (v: unknown): VariableValue => v as VariableValue

// Helper transformers
const toTxPower = passthrough
const toFrequency = (v: unknown): VariableValue => (v as number) / 1000
const toStateLabel = (v: unknown): VariableValue => (v === RfState.Active ? 'Active' : 'Muted')
const toStartupStateLabel = (v: unknown): VariableValue =>
	v ? (v === RfStateStartup.Active ? 'Active' : v === RfStateStartup.Muted ? 'Muted' : 'Last State') : 'Unknown'
const toBindingLabel = (v: unknown): VariableValue => {
	const binding = (v as AntennaBinding[])?.[0]?.binding
	return Object.keys(RFChannels).find((key) => RFChannels[key as keyof typeof RFChannels] === binding) ?? 'None'
}
const toAudioLinkModeLabel = (v: unknown): VariableValue => AudiolinkModeId[v as number] ?? 'Unknown'
const toMicLowCutLabel = (v: unknown, state: SEKDevice | SKMDevice): VariableValue => {
	if (state.type === MtType.SEK) {
		return v === MicLowCutHzSEK.Off ? 'Off' : (v as number)
	} else if (state.type === MtType.SKM) {
		return v === MicLowCutHzSKM.Off ? 'Off' : (v as number)
	}
	return v as number
}

export const psuStatusLabels: Record<PsuStatus, string> = {
	[PsuStatus.Connected]: 'Connected',
	[PsuStatus.Unconnected]: 'Unconnected',
	[PsuStatus.Disconnected]: 'Disconnected',
}
const toPsuLabel = (v: unknown): VariableValue => psuStatusLabels[v as PsuStatus]
const joinWarnings = (v: unknown): VariableValue => ((v as string[])?.length ? (v as string[]).join(', ') : 'None')

export const inputSourceLabels: Record<InputSource, string> = {
	[InputSource.Dante]: 'Dante',
	[InputSource['MADI 1']]: 'MADI 1',
	[InputSource['MADI 2']]: 'MADI 2',
}
const toInputSourceLabel = (v: unknown): VariableValue => inputSourceLabels[v as InputSource] ?? (v as string)

const dadTempActive = (v: unknown): boolean => Boolean(v && (v as number) > -55)
const toDadTempCelsius = (v: unknown): VariableValue => (dadTempActive(v) ? (v as number) : 'Off')
const toDadTempFahrenheit = (v: unknown): VariableValue => (dadTempActive(v) ? ((v as number) * 9) / 5 + 32 : 'Off')

export const RfChannelStateMap: StateMap<RfChannel> = {
	txPower: { feedback: 'rfTxPower', variable: 'tx_power', valueFn: toTxPower },
	frequency: { feedback: 'rfFrequency', variable: 'frequency', valueFn: toFrequency },
	bandwidthMode: { feedback: 'rfBandwidthMode', variable: 'bandwidth_mode', valueFn: passthrough },
	rfRestrictionViolation: {
		feedback: 'rfRestrictionViolation',
		variable: 'rf_restriction_violation',
		valueFn: passthrough,
	},
	rfState: { feedback: 'rfState', variable: 'state', valueFn: toStateLabel },
	rfStateOnStartup: { feedback: 'rfStateOnStartup', variable: 'startup_state', valueFn: toStartupStateLabel },
}

export const AntennaStateMap: StateMap<Antenna> = {
	state: { feedback: ['dadState', 'dadAntennaPresent'], variable: 'state', valueFn: passthrough },
	type: { variable: 'type', valueFn: passthrough },
	errorStateDetails: { variable: 'error_details', valueFn: passthrough },
	warningHighTemperature: {
		feedback: 'dadWarningHighTemperature',
		variable: 'high_temp_warning',
		valueFn: passthrough,
	},
	warningPacketError: {
		feedback: 'dadWarningPacketError',
		variable: 'packet_error_warning',
		valueFn: passthrough,
	},
	interference: {
		feedback: 'dadInterference',
		variable: 'interference_severity',
		valueFn: (v: unknown): VariableValue => (v as InterferenceDetail | undefined)?.severity ?? 'None',
	},
	interferenceTotalPower: {
		feedback: 'dadInterferencePower',
		variable: 'noise_level',
		valueFn: passthrough,
	},
	temperature: {
		feedback: 'dadTemperature',
		variableSuffixes: [
			{ suffix: 'temp_celsius', valueFn: toDadTempCelsius },
			{ suffix: 'temp_fahrenheit', valueFn: toDadTempFahrenheit },
		],
	},
	version: { variable: 'version', valueFn: passthrough },
	identify: { feedback: 'dadIdentify', variable: 'identify', valueFn: passthrough },
	ledBrightness: { feedback: 'dadLedBrightness', variable: 'led_brightness', valueFn: passthrough },
	bindings: { feedback: 'dadBindings', variable: 'bindings', valueFn: toBindingLabel },
}

export const AudioInputStateMap: StateMap<AudioInput> = {
	source: { feedback: 'audioInputInterface', variable: 'interface', valueFn: toInputSourceLabel },
	name: { variable: 'name', valueFn: passthrough },
	iemAudiolinkId: {
		feedback: ['iemAudioInputLinked', 'iemAudioInputNoLinkId'],
		variable: 'iem_link_id',
		valueFn: passthrough,
	},
}

export const AudioOutputStateMap: StateMap<AudioOutput> = {
	micAudiolinkId: { feedback: 'mobileDeviceOutputLinked', variable: 'mic_link_id', valueFn: passthrough },
	commandModeAudioNetwork: { feedback: 'audioOutputInterface', valueFn: passthrough },
	commandModeMadi1: { feedback: 'audioOutputInterface', valueFn: passthrough },
	commandModeMadi2: { feedback: 'audioOutputInterface', valueFn: passthrough },
}

export const MobileDeviceStateMap: StateMap<SEKDevice & SKMDevice> = {
	mtUid: { variable: 'mt_uid', valueFn: passthrough },
	type: { variable: 'mt_type', valueFn: passthrough },
	frequencyRange: {
		feedback: 'mobileDeviceFrequencyRange',
		variable: 'frequency_range',
		valueFn: passthrough,
	},
	rfChannelId: { feedback: 'mobileDeviceRfChannelId', variable: 'rf_channel_id', valueFn: passthrough },
	identify: { feedback: 'mobileDeviceIdentify', variable: 'identify', valueFn: passthrough },
	reverseIdentify: {
		feedback: 'mobileDeviceReverseIdentify',
		variable: 'reverse_identify',
		valueFn: passthrough,
	},
	serial: { variable: 'serial', valueFn: passthrough },
	connected: { feedback: 'mobileDeviceConnected', variable: 'connected', valueFn: passthrough },
	lastConnected: {
		feedback: 'mobileDeviceLastConnected',
		variable: 'last_connected',
		valueFn: passthrough,
	},
	sleep: { feedback: 'mobileDeviceSleep', variable: 'sleep', valueFn: passthrough },
	state: { feedback: 'mobileDeviceState', variable: 'state', valueFn: passthrough },
	batteryFillLevel: {
		feedback: 'mobileDeviceBatteryLevel',
		variable: 'battery_level',
		valueFn: (v: unknown): VariableValue => (v === -1 ? 'Off' : (v as VariableValue)),
	},
	batteryRuntime: {
		feedback: 'mobileDeviceBatteryRuntime',
		variable: 'battery_runtime',
		valueFn: (v: unknown): VariableValue => formatBatteryRuntimeMinutes(typeof v === 'number' ? v : undefined),
	},
	batteryLow: { feedback: 'mobileDeviceBatteryLow', variable: 'battery_low', valueFn: passthrough },
	version: { variable: 'version', valueFn: passthrough },
	versionMismatch: { variable: 'version_mismatch', valueFn: passthrough },
	fccId: { variable: 'fcc_id', valueFn: passthrough },
	ledBrightness: {
		feedback: 'mobileDeviceLedBrightness',
		variable: 'led_brightness',
		valueFn: passthrough,
	},
	swUpdatePossible: { variable: 'sw_update_possible', valueFn: passthrough },
	swUpdateProgress: { variable: 'sw_update_progress', valueFn: passthrough },
	micAudiolinkId: {
		feedback: 'mobileDeviceMicAudiolinkId',
		variable: 'mic_audiolink_id',
		valueFn: passthrough,
	},
	micAudiolinkActive: {
		feedback: 'mobileDeviceMicAudiolinkActive',
		variable: 'mic_audiolink_active',
		valueFn: passthrough,
	},
	micTestToneEnabled: {
		feedback: 'mobileDeviceMicTestToneEnabled',
		variable: 'mic_test_tone_enabled',
		valueFn: passthrough,
	},
	micTestToneLevel: {
		feedback: 'mobileDeviceMicTestToneLevel',
		variable: 'mic_test_tone_level',
		valueFn: passthrough,
	},
	commandState: { variable: 'command_state', valueFn: passthrough },
	micLqi: { feedback: 'mobileDeviceMicLqi', variable: 'mic_lqi', valueFn: passthrough },
	interference: {
		feedback: 'mobileDeviceInterference',
		variable: 'interference',
		valueFn: (v: unknown): VariableValue => (v as InterferenceDetail | undefined)?.severity,
	},
	dominantAntenna: {
		feedback: 'mobileDeviceDominantAntenna',
		variable: 'dominant_antenna',
		valueFn: (v: unknown): VariableValue => (typeof v === 'string' && v !== 'NotAvailable' ? v.toUpperCase() : 'N/A'),
	},
	rssi: { feedback: 'mobileDeviceRSSI', variable: 'rssi', valueFn: passthrough },
	// SEK specific
	headphoneVolume: {
		feedback: 'mobileDeviceHeadphoneVolume',
		variable: 'headphone_volume',
		valueFn: passthrough,
	},
	headphoneBalance: {
		feedback: 'mobileDeviceHeadphoneBalance',
		variable: 'headphone_balance',
		valueFn: passthrough,
	},
	micPreampGain: {
		feedback: 'mobileDeviceMicPreampGain',
		variable: 'mic_preamp_gain',
		valueFn: passthrough,
	},
	micLowCutHz: {
		feedback: 'mobileDeviceMicLowCutHz',
		variable: 'mic_lowcut_hz',
		valueFn: toMicLowCutLabel,
	},
	iemAudiolinkId: {
		feedback: ['iemAudioInputLinked', 'iemAudioInputNoLinkId'],
		variable: 'iem_audiolink_id',
		valueFn: passthrough,
	},
	iemAudiolinkActive: {
		feedback: 'iemAudioLinkActive',
		variable: 'iem_audiolink_active',
		valueFn: passthrough,
	},
	headphonePlugState: {
		feedback: 'mobileDeviceHeadphonePlugState',
		variable: 'headphone_plug_state',
		valueFn: (v: unknown): VariableValue => (v === 'NotAvailable' ? 'N/A' : (v as VariableValue)),
	},
	headphoneVolumeMax: {
		feedback: 'mobileDeviceHeadphoneVolumeMax',
		variable: 'headphone_volume_max',
		valueFn: passthrough,
	},
	headphoneVolumeMin: {
		feedback: 'mobileDeviceHeadphoneVolumeMin',
		variable: 'headphone_volume_min',
		valueFn: passthrough,
	},
	micLineSelection: {
		feedback: 'mobileDeviceMicLineSelection',
		variable: 'mic_line_selection',
		valueFn: passthrough,
	},
	micLineSelectionAutoValue: {
		feedback: 'mobileDeviceMicLineSelectionAutoValue',
		variable: 'mic_line_selection_auto_value',
		valueFn: passthrough,
	},
	cableEmulation: {
		feedback: 'mobileDeviceCableEmulation',
		variable: 'cable_emulation',
		valueFn: passthrough,
	},
	iemLqi: { feedback: 'mobileDeviceIemLqi', variable: 'iem_lqi', valueFn: passthrough },
	// SKM specific
	commandBehavior: { variable: 'command_behavior', valueFn: passthrough },
	micModule: {
		variable: 'mic_module',
		valueFn: (v: unknown): VariableValue => (v as MicModule | undefined)?.name,
	},
}

export const PsuStateMap: StateMap<PsuState> = {
	psu1: { feedback: 'baseStationPsu', variable: 'health_psu_1_state', valueFn: toPsuLabel },
	psu2: { feedback: 'baseStationPsu', variable: 'health_psu_2_state', valueFn: toPsuLabel },
}

// Special case: Fan state is dynamic per fan ID, variables are constructed manually in helper if needed or key mapping
// For fans, value is FanState.
export const FanStateMap: StateMap<FanState> = {
	errorState: {
		variable: 'error',
		valueFn: (v: unknown): VariableValue => (v as FanState['errorState'])?.value,
	},
}

export const TempStateMap: StateMap<TempState> = {
	value: { variable: 'health_temp_state', valueFn: passthrough },
}

export const BaseStationIdentityMap: StateMap<BaseStationIdentity> = {
	product: { variable: 'base_station_model', valueFn: passthrough },
	serial: { variable: 'base_station_serial', valueFn: passthrough },
	hardwareRevision: { variable: 'base_station_version', valueFn: passthrough },
}

export const BaseStationStateMap: StateMap<BaseStationState> = {
	state: { feedback: 'baseStationState', variable: 'base_station_state', valueFn: passthrough },
	warnings: { feedback: 'baseStationWarnings', variable: 'base_station_warnings', valueFn: joinWarnings },
}

export const BaseStationSiteMap: StateMap<BaseStationSite> = {
	deviceName: { variable: 'base_station_name', valueFn: passthrough },
	location: { variable: 'base_station_location', valueFn: passthrough },
	position: { variable: 'base_station_position', valueFn: passthrough },
}

export const AudioLinkStateMap: StateMap<AudioLink> = {
	audiolinkId: { variable: 'id', valueFn: passthrough },
	rfChannelId: { variable: 'rf_channel_id', valueFn: passthrough },
	modeId: { variable: 'mode', valueFn: toAudioLinkModeLabel },
}

export const AudioNetworkStateMap: StateMap<InterfaceStatusAudioNetwork> = {
	status: { feedback: 'audioInterfaceStatus', variable: 'status', valueFn: passthrough },
	sampleRateHz: { variable: 'sample_rate', valueFn: passthrough },
	mute: { variable: 'mute', valueFn: passthrough },
}

export const MadiStateMap: StateMap<Pick<InterfaceStatusMadi, 'moduleType'>> = {
	moduleType: { variable: 'module_type', valueFn: passthrough },
}

export const MadiInputStateMap: StateMap<InterfaceStatusMadi['inputStatus']> = {
	status: { feedback: 'audioInterfaceStatus', variable: 'input_status', valueFn: passthrough },
	sampleRateHz: { variable: 'input_sample_rate', valueFn: passthrough },
	mute: { variable: 'input_mute', valueFn: passthrough },
	channels: { variable: 'input_channels', valueFn: passthrough },
	fewerChannelsThanUsed: { variable: 'input_fewer_channels_than_used', valueFn: passthrough },
}

export const MadiOutputStateMap: StateMap<InterfaceStatusMadi['outputStatus']> = {
	clockSource: { variable: 'output_clock_source', valueFn: passthrough },
	clockSourceStatus: {
		feedback: 'audioInterfaceStatus',
		variable: 'output_clock_source_status',
		valueFn: passthrough,
	},
	fallbackToInternalClockActive: { variable: 'output_fallback_active', valueFn: passthrough },
	sampleRateHz: { variable: 'output_sample_rate', valueFn: passthrough },
	mute: { variable: 'output_mute', valueFn: passthrough },
	channels: { variable: 'output_channels', valueFn: passthrough },
}

export const WordclockInputStateMap: StateMap<InterfaceStatusWordclock['inputStatus']> = {
	status: { feedback: 'audioInterfaceStatus', variable: 'input_status', valueFn: passthrough },
	sampleRateHz: { variable: 'input_sample_rate', valueFn: passthrough },
}

export const WordclockOutputStateMap: StateMap<InterfaceStatusWordclock['outputStatus']> = {
	clockSource: { variable: 'output_clock_source', valueFn: passthrough },
	clockSourceStatus: {
		feedback: 'audioInterfaceStatus',
		variable: 'output_clock_source_status',
		valueFn: passthrough,
	},
	fallbackToInternalClockActive: { variable: 'output_fallback_active', valueFn: passthrough },
	sampleRateHz: { variable: 'output_sample_rate', valueFn: passthrough },
}
