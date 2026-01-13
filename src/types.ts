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
	Madi1 = 'madi1',
	Madi2 = 'madi2',
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

// Interfaces
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
	micLowCutHz: number
	iemAudiolinkId?: number
	iemAudiolinkActive?: boolean
	headphonePlugState?: string
	headphoneVolumeLimit?: number
	headphoneVolumeMax?: number
	headphoneVolumeMin?: number
	micLineSelection?: string
	micLineSelectionAutoValue?: string
	cableEmulation?: CableEmulation
	iemLqi?: number
}

export interface SKMDevice extends MobileDeviceBase {
	type: MtType.SKM
	micPreampGain: number
	micLowCutHz: number
	commandBehavior: string
	micModule?: string
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
	Medium = 'Medium',
	High = 'High',
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
