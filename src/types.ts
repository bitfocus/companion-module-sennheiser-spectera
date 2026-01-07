export type Frequency = number

export enum RfState {
	Active = 'RfActive',
	Muted = 'RfMuted',
}

export enum InstanceStatus {
	Unconnected = 'Unconnected',
	Connected = 'Connected',
	Updating = 'Updating',
	Initialized = 'Initialized',
	Error = 'Error',
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
	txPower: number
	frequency: Frequency
	bandwidthMode: number
	rfRestrictionViolation?: boolean
	rfState: RfState
	rfStateOnStartup?: string
}

export interface Antenna {
	antennaPortId: string
	state: InstanceStatus
	errorStateDetails?: string
	warningHighTemperature?: boolean
	warningPacketError?: boolean
	temperature?: number
	type: string
	version?: string
	identify: boolean
	ledBrightness: string
	bindings: AntennaBinding[]
}

export interface AntennaBinding {
	subAntennaId: string
	binding: AntennaBindingEnum
	mismatch: boolean
}

export enum AntennaBindingEnum {
	RfChannel0 = 'RF Channel 1',
	RfChannel1 = 'RF Channel 2',
	Off = 'Off',
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
	ledBrightness?: string
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
	cableEmulation?: string
	iemLqi?: number
}

export interface SKMDevice extends MobileDeviceBase {
	type: MtType.SKM
	micPreampGain: number
	micLowCutHz: number
	commandBehavior: string
	micModule?: string
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
	Connected = 'Connected',
	Unconnected = 'Unconnected',
	Disconnected = 'Disconnected',
}

export interface PsuState {
	psu1: PsuStatus
	psu2: PsuStatus
}

export enum TempStatus {
	Normal = 'Normal',
	Warning = 'Warning',
	Critical = 'Critical',
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

export interface DeviceIdentity {
	product: string
	hardwareRevision: string
	serial: string
	vendor: string
}

export interface DeviceState {
	state: string
	warnings: string[]
}

export interface DeviceSite {
	deviceName: string
	location: string
	position: string
}

export interface DeviceInfoState {
	identity?: DeviceIdentity
	state?: DeviceState
	site?: DeviceSite
}
