import { combineRgb } from '@companion-module/base'
import { SpecteraState } from './state.js'
import { Antenna, AudiolinkModeId, InputSource, MobileDevice, MtType, RfChannel, RFChannels } from './types.js'

export const Color = {
	Black: combineRgb(0, 0, 0),
	White: combineRgb(255, 255, 255),
	LightGray: combineRgb(72, 72, 72),
	DarkGreen: combineRgb(75, 127, 76),
	SpecteraDarkGray: combineRgb(40, 41, 46),
	SpecteraLightGray: combineRgb(46, 48, 54),
	SpecteraRed: combineRgb(244, 67, 54),
	SpecteraGreen: combineRgb(102, 187, 106),
	SpecteraBlue: combineRgb(0, 150, 214),
	SpecteraYellow: combineRgb(255, 167, 38),
}

export const audioOutputChannelChoices = [
	{ id: 'commandModeAudioNetwork', label: 'Dante' },
	{ id: 'commandModeMadi1', label: 'MADI 1' },
	{ id: 'commandModeMadi2', label: 'MADI 2' },
] as const

const INPUT_SOURCE_CYCLE = [InputSource.Dante, InputSource['MADI 1'], InputSource['MADI 2']] as const

/**
 * Map On/Off/Toggle to a new input `source`. Off turns the selected interface "off" by switching
 * to another source when it is currently active. Returns undefined when no API update is needed.
 */
export function resolveInputSourceForMode(
	current: InputSource | undefined,
	iface: InputSource,
	mode: 'On' | 'Off' | 'Toggle',
): InputSource | undefined {
	if (mode === 'On') return iface
	const pickOther = (): InputSource | undefined => INPUT_SOURCE_CYCLE.find((s) => s !== iface)
	if (mode === 'Off') {
		if (current === iface) return pickOther()
		return undefined
	}
	if (current === iface) return pickOther()
	return iface
}

export function getChoicesFromEnum(enumObj: Record<string, string | number>): { id: string | number; label: string }[] {
	const choices: { id: string | number; label: string }[] = []

	for (const key in enumObj) {
		if (Object.prototype.hasOwnProperty.call(enumObj, key)) {
			const value = enumObj[key]
			// Filter out numeric keys for reverse mappings in numeric enums
			if (!isNaN(Number(key))) {
				continue
			}
			choices.push({ id: value, label: key })
		}
	}

	return choices
}

export function getMobileDeviceChoices(state: SpecteraState, filterType?: MtType): { id: string; label: string }[] {
	const choices: { id: string; label: string }[] = []
	for (const device of state.mobileDevices.values()) {
		if (!filterType || device.type === filterType) {
			choices.push({ id: device.serial ?? String(device.mtUid), label: `${device.name} (${device.serial})` })
		}
	}

	choices.sort((a, b) => a.label.localeCompare(b.label))

	if (choices.length === 0) {
		choices.push({ id: '', label: 'No Devices Found' })
	}
	return choices
}

// Mobile device display name: allowed charset, max 16 characters (spaces count).
const MOBILE_DEVICE_NAME_ALLOWED = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-+=*/;<>#|,. \u0020'

export function sanitizeMobileDeviceName(raw: string): string {
	return [...raw]
		.filter((c) => MOBILE_DEVICE_NAME_ALLOWED.includes(c))
		.join('')
		.slice(0, 16)
}

// Format battery runtime from minutes to "H:MM". Returns 'Off' for undefined or -1. */
export function formatBatteryRuntimeMinutes(minutes: number | undefined): string {
	if (minutes === undefined || minutes === -1) return 'Off'
	return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
}

export function getDeviceBySerial(state: SpecteraState, serial: string): MobileDevice | undefined {
	if (!serial) return undefined
	for (const device of state.mobileDevices.values()) {
		if (device.serial === serial) return device
	}
	return undefined
}

//Mic link `modeId` from module state for this device only (not the selected output).
export function getExistingMicAudiolinkModeFromState(state: SpecteraState, device: MobileDevice): number | undefined {
	const devLinkId = device.micAudiolinkId
	if (devLinkId !== undefined && devLinkId > -1) {
		const mode = state.audioLinks.get(devLinkId)?.modeId
		if (mode !== undefined) {
			if (mode === AudiolinkModeId['None']) return undefined
			return Number(mode)
		}
	}
	return undefined
}

// Offset added to stereo pair IDs to distinguish them from mono input IDs.
export const STEREO_INPUT_OFFSET = 1000

export function getAudioLinkChoices(state: SpecteraState): { id: number; label: string }[] {
	const sortedInputs = Array.from(state.audioInputs.values()).sort((a, b) => a.inputId - b.inputId)
	const choices: { id: number; label: string }[] = []

	// Stereo pairs first (consecutive pairs: 0+1, 2+3, etc.)
	for (let i = 0; i + 1 < sortedInputs.length; i += 2) {
		const input1 = sortedInputs[i]
		const input2 = sortedInputs[i + 1]
		choices.push({
			id: STEREO_INPUT_OFFSET + input1.inputId,
			label: `Input ${input1.inputId + 1} + ${input2.inputId + 1}`,
		})
	}

	// Mono inputs after
	for (const input of sortedInputs) {
		choices.push({
			id: input.inputId,
			label: input.name || `Input ${input.inputId + 1}`,
		})
	}

	return choices
}

// Map antenna binding enum value to rfChannelId for state.rfChannels lookup.
function bindingToRfChannelId(binding: RFChannels | undefined): number | undefined {
	if (binding === undefined) return undefined
	if (binding === RFChannels['RF Channel 1']) return 0
	if (binding === RFChannels['RF Channel 2']) return 1
	return undefined
}

// DAD frequency (MHz) from antenna binding + RF channel state.
export function getAntennaFrequency(antenna: Antenna, rfChannels: Map<number, RfChannel>): number | string {
	const binding = antenna.bindings[0]?.binding
	if (binding === RFChannels.Scan) return 'Scan'
	if (binding === RFChannels.Off) return 'Off'
	const channelId = bindingToRfChannelId(binding)
	const channel = channelId !== undefined ? rfChannels.get(channelId) : undefined
	return channel !== undefined ? channel.frequency / 1000 : '—'
}
