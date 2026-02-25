// Enums
export enum RfState {
	Active = 'RfActive',
	Muted = 'RfMuted',
}

export enum RfStateStartup {
	Active = 'RfActive',
	Muted = 'RfMuted',
	LastState = 'RfLastState',
}

export enum RFChannels {
	Off = 'Off',
	'RF Channel 1' = 'RfChannel0',
	'RF Channel 2' = 'RfChannel1',
	'Scan' = 'Scan',
}

export enum TxPower {
	'10 Mw' = 10,
	'20 Mw' = 20,
	'30 Mw' = 30,
	'50 Mw' = 50,
	'100 Mw' = 100,
}

export enum BandwidthMode {
	'6 MHz' = 6000,
	'8 MHz' = 8000,
	'10 MHz' = 10000,
}

export enum DeviceStatus {
	Unconnected = 'Unconnected',
	Connected = 'Connected',
	Updating = 'Updating',
	Initialized = 'Initialized',
	Error = 'Error',
}

export enum BaseStationStatus {
	Initializing = 'Initializing',
	Normal = 'Normal',
	FactoryReset = 'FactoryReset',
	Standby = 'Standby',
	Cooldown = 'Cooldown',
	Warmup = 'Warmup',
	CriticalFailure = 'CriticalFailure',
}

export enum MtState {
	Connected = 'Connected',
	Disconnected = 'Disconnected',
	Syncing = 'Syncing',
	Sleeping = 'Sleeping',
	Updating = 'Updating',
}

export enum MtType {
	Unknown = 'Unknown',
	SEK = 'SEK',
	SKM = 'SKM',
}

export enum InputSource {
	Dante = 'dante',
	'MADI 1' = 'madi1',
	'MADI 2' = 'madi2',
}

export enum TempStatus {
	Normal = 'Normal',
	Warning = 'Warning',
	Critical = 'Critical',
}

export enum LedBrightness {
	Off = 'Off',
	Dim = 'Dim',
	Standard = 'Standard',
	Bright = 'Bright',
}

export enum AntennaPortId {
	A = 'a',
	B = 'b',
	C = 'c',
	D = 'd',
}

export enum AudiolinkModeId {
	'RAW Low Latency (Mono)' = 11,
	'RAW (Mono)' = 10,
	'LIVE Ultra Low Latency (Stereo)' = 9,
	'LIVE Low Latency (Stereo)' = 8,
	'LIVE (Stereo)' = 7,
	'LIVE Link Density (Stereo)' = 6,
	'LIVE Low Latency (Mono)' = 5,
	'LIVE (Mono)' = 4,
	'LIVE Link Density (Mono)' = 3,
	'MAX Link Density (Mono)' = 2,
	'MAX Range (Mono)' = 1,
	'Empty (Stereo)' = 1002,
	'Empty (Mono)' = 1001,
}

export enum IemAudiolinkMode {
	'LIVE Ultra Low Latency (Stereo)' = 9,
	'LIVE Low Latency (Stereo)' = 8,
	'LIVE (Stereo)' = 7,
	'LIVE Link Density (Stereo)' = 6,
	'LIVE (Mono)' = 4,
	'LIVE Link Density (Mono)' = 3,
	'MAX Link Density (Mono)' = 2,
	'MAX Range (Mono)' = 1,
	'Empty (Stereo)' = 1002,
	'Empty (Mono)' = 1001,
}

export enum MicAudiolinkMode {
	'RAW Low Latency (Mono)' = 11,
	'RAW (Mono)' = 10,
	'LIVE Low Latency (Mono)' = 5,
	'LIVE (Mono)' = 4,
	'LIVE Link Density (Mono)' = 3,
	'MAX Link Density (Mono)' = 2,
	'MAX Range (Mono)' = 1,
	'Empty (Mono)' = 1001,
}

export enum MicLineSelection {
	Auto = 'Auto',
	Mic = 'Mic',
	Line = 'Line',
}

export enum MicLineSelectionAuto {
	Unknown = 'Unknown',
	Mic = 'Mic',
	Line = 'Line',
}

export enum MicLowCutHzSEK {
	'Off' = 20,
	'30 Hz' = 30,
	'60 Hz' = 60,
	'80 Hz' = 80,
	'100 Hz' = 100,
	'120 Hz' = 120,
}

export enum MicLowCutHzSKM {
	'Off' = 60,
	'80 Hz' = 80,
	'100 Hz' = 100,
	'120 Hz' = 120,
}

// Interfaces
export interface AudioLink {
	audiolinkId: number
	rfChannelId: number
	modeId: AudiolinkModeId
}

export interface AudioInput {
	inputId: number
	iemAudiolinkId: number
	source: InputSource
	name: string
}

export interface AudioOutput {
	outputId: number
	micAudiolinkId: number
	commandModeAudioNetwork: string
	commandModeMadi1: string
	commandModeMadi2: string
}

export interface RfChannel {
	rfChannelId: number
	txPower: TxPower
	/**
	 * Frequency in kHz.
	 * Min: 10000, Max: 10000000, Step: 1000.
	 * Default: 474000.
	 */
	frequency: number
	/**
	 * Bandwidth of the modulated signal in kHz.
	 * Limited to country specific license.
	 * Values: 6000 (6 MHz), 8000 (8 MHz), 10000 (10 MHz)
	 */
	bandwidthMode: BandwidthMode
	rfRestrictionViolation?: boolean
	rfState: RfState
	rfStateOnStartup?: RfStateStartup
}

export interface Antenna {
	antennaPortId: AntennaPortId
	state: DeviceStatus
	errorStateDetails?: string
	warningHighTemperature?: boolean
	warningPacketError?: boolean
	interference?: InterferenceDetail
	/** Set from interference.totalPower so state map and variables can use a single key. */
	interferenceTotalPower?: number
	temperature?: number
	type: string
	version?: string
	identify: boolean
	ledBrightness: LedBrightness
	bindings: AntennaBinding[]
}

export interface AntennaBinding {
	subAntennaId: number
	binding: RFChannels
	mismatch: boolean
}

export interface MobileDeviceBase {
	mtUid: number
	type: MtType
	frequencyRange?: string
	rfChannelId?: number
	identify: boolean
	reverseIdentify?: boolean
	name: string
	serial?: string
	connected?: boolean
	sleep: boolean
	state: MtState
	lastConnected?: string
	batteryFillLevel?: number
	batteryRuntime?: number
	batteryLow?: boolean
	version?: string
	versionMismatch?: boolean
	fccId?: string
	ledBrightness?: LedBrightness
	swUpdatePossible?: boolean
	swUpdateProgress?: number
	micAudiolinkId?: number
	micAudiolinkActive?: boolean
	micTestToneEnabled?: boolean
	micTestToneLevel?: number
	commandState?: string
	micLqi?: number
	interference?: { severity: Interference }
	dominantAntenna?: string
	rssi?: number
}

export interface SEKDevice extends MobileDeviceBase {
	type: MtType.SEK
	headphoneVolume: number
	headphoneBalance: number
	micPreampGain: number
	iemAudiolinkId?: number
	iemAudiolinkActive?: boolean
	headphonePlugState?: string
	headphoneVolumeLimit?: number
	headphoneVolumeMax?: number
	headphoneVolumeMin?: number
	micLineSelection?: MicLineSelection
	micLineSelectionAutoValue?: MicLineSelectionAuto
	micLowCutHz: MicLowCutHzSEK
	cableEmulation?: CableEmulation
	iemLqi?: number
}

export interface SKMDevice extends MobileDeviceBase {
	type: MtType.SKM
	micPreampGain: number
	micLowCutHz: MicLowCutHzSKM
	commandBehavior: string
	micModule?: MicModule
}

export enum MicModuleName {
	NotAvailable = 'NotAvailable',
	None = 'None',
	Unknown = 'Unknown',
	SennheiserMD9235 = 'SennheiserMD9235',
	SennheiserME9002 = 'SennheiserME9002',
	SennheiserME9004 = 'SennheiserME9004',
	SennheiserME9005 = 'SennheiserME9005',
	SennheiserMM435 = 'SennheiserMM435',
	SennheiserMM445 = 'SennheiserMM445',
	SennheiserMMD42_1 = 'SennheiserMMD42-1',
	SennheiserMMD815_1 = 'SennheiserMMD815-1',
	SennheiserMMD835_1 = 'SennheiserMMD835-1',
	SennheiserMMD845_1 = 'SennheiserMMD845-1',
	SennheiserMMD935_1 = 'SennheiserMMD935-1',
	SennheiserMMD945_1 = 'SennheiserMMD945-1',
	SennheiserMME865_1 = 'SennheiserMME865-1',
	SennheiserMMK965_1 = 'SennheiserMMK965-1',
	SennheiserCustom = 'SennheiserCustom',
	NeumannKK104A = 'NeumannKK104A',
	NeumannKK105A = 'NeumannKK105A',
	NeumannKK204 = 'NeumannKK204',
	NeumannKK205 = 'NeumannKK205',
	ThirdPartyAdapter = 'ThirdPartyAdapter',
}

export enum MicModulePickupPattern {
	NotApplicable = 'NotApplicable',
	Omni = 'Omni',
	Cardioid = 'Cardioid',
	Supercardioid = 'Supercardioid',
}

export enum MicModulePad {
	NotApplicable = 'NotApplicable',
	Disabled = 'Disabled',
	Start10dB = '10dB',
}

export interface MicModule {
	name: MicModuleName
	pickupPattern: MicModulePickupPattern
	pad: MicModulePad
}

export enum CableEmulation {
	Off = 'Off',
	Short = 'Short',
	Mid = 'Mid',
	Long = 'Long',
}

export enum Interference {
	None = 'None',
	Low = 'Low',
	Mid = 'Mid',
	High = 'High',
}

export interface InterferenceDetail {
	severity: Interference
	totalPower?: number
	residual?: {
		severity: Interference
		power: number
	}
	mainInterferers?: {
		severity: Interference
		power: number
		frequency: number
	}[]
}

export type MobileDevice = SEKDevice | SKMDevice

export interface AudioLevel {
	peak: number[]
	rms: number[]
}

export interface AudioLevels {
	madi1In?: AudioLevel
	madi2In?: AudioLevel
	danteIn?: AudioLevel
	madi1Out?: AudioLevel
	madi2Out?: AudioLevel
	danteOut?: AudioLevel
	updateCounter: number
}

export enum PsuStatus {
	Connected = 'connected',
	Unconnected = 'unconnected',
	Disconnected = 'disconnected',
}

export interface PsuState {
	psu1: PsuStatus
	psu2: PsuStatus
}

export interface TempState {
	value: TempStatus
}

export interface FanState {
	fanId: string
	errorState: { value: boolean }
}

export interface HealthState {
	psu: PsuState
	temp: TempState
	fans: Record<string, FanState>
}

export interface BaseStationIdentity {
	product: string
	hardwareRevision: string
	serial: string
	vendor: string
}

export interface BaseStationState {
	state: BaseStationStatus
	warnings: string[]
}

export interface BaseStationSite {
	deviceName: string
	location: string
	position: string
}

export interface BaseStationInfo {
	identity?: BaseStationIdentity
	state?: BaseStationState
	site?: BaseStationSite
}

export enum InterfaceInputStatus {
	NoToggle = 'NoToggle',
	TooFast = 'TooFast',
	Mismatch = 'Mismatch',
	Unlocked = 'Unlocked',
	Locked = 'Locked',
	LoopThrough = 'LoopThrough',
}

export enum AudioNetworkType {
	None = 'None',
	Unknown = 'Unknown',
	Dante = 'Dante',
}

export enum MadiModuleType {
	None = 'None',
	Unknown = 'Unknown',
	Coax = 'Coax',
	OpticalMultimode = 'OpticalMultimode',
}

export enum OutputClockSource {
	Internal48kHz = 'Internal48kHz',
	Internal96kHz = 'Internal96kHz',
	WordclockIn = 'WordclockIn',
	AudioNetwork = 'AudioNetwork',
	Madi1In = 'Madi1In',
	Madi2In = 'Madi2In',
}

export interface InterfaceStatusAudioNetwork {
	audioNetworkType: AudioNetworkType
	status: InterfaceInputStatus
	sampleRateHz: number
	mute: boolean
}

export interface InterfaceStatusMadi {
	moduleType: MadiModuleType
	inputStatus: {
		status: InterfaceInputStatus
		sampleRateHz: number
		mute: boolean
		channels: number
		fewerChannelsThanUsed: boolean
	}
	outputStatus: {
		clockSource: OutputClockSource
		clockSourceStatus: InterfaceInputStatus
		fallbackToInternalClockActive: boolean
		sampleRateHz: number
		mute: boolean
		channels: number
	}
}

export interface InterfaceStatusWordclock {
	inputStatus: {
		status: InterfaceInputStatus
		sampleRateHz: number
	}
	outputStatus: {
		clockSource: OutputClockSource
		clockSourceStatus: InterfaceInputStatus
		fallbackToInternalClockActive: boolean
		sampleRateHz: number
	}
}
