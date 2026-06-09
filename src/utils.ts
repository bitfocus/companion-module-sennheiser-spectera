import { combineRgb, type InputValue } from '@companion-module/base'
import { SpecteraState } from './state.js'
import { Antenna, AudiolinkModeId, MobileDevice, MtType, RfChannel, RFChannels } from './types.js'
import type { LedColors } from './types.js'

export const DEFAULT_CONNECTED_STATE_COLOR = '#00A100'
export const DEFAULT_LED_COLORS: LedColors = {
	rfActive: '#00A100',
	rfMuted: '#A18700',
}

export const LED_COLOR_PRESETS = ['#000000', '#008700', '#00A100', '#00FF00', '#877200', '#A18700', '#FFD700'] as const

function toHexByte(value: number): string {
	return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0').toUpperCase()
}

/** Normalize a Companion colorpicker value to #RRGGBB for the Spectera API. */
export function normalizeHexColor(color: InputValue | undefined): string {
	if (color === undefined || color === null || color === '') return ''

	if (typeof color === 'boolean' || Array.isArray(color)) return ''

	if (typeof color === 'number') {
		const r = (color >> 16) & 0xff
		const g = (color >> 8) & 0xff
		const b = color & 0xff
		return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`
	}

	const trimmed = color.trim()
	if (trimmed.startsWith('#')) {
		const hex = trimmed.slice(1)
		if (hex.length === 3) {
			return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase()
		}
		if (hex.length >= 6) {
			return `#${hex.slice(0, 6).toUpperCase()}`
		}
	}

	const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
	if (rgbMatch) {
		return `#${toHexByte(Number(rgbMatch[1]))}${toHexByte(Number(rgbMatch[2]))}${toHexByte(Number(rgbMatch[3]))}`
	}

	return trimmed
}

export function colorsMatch(a: string | undefined, b: InputValue | undefined): boolean {
	if (!a || b === undefined || b === '') return false
	return normalizeHexColor(a).toLowerCase() === normalizeHexColor(b).toLowerCase()
}

/** Convert a Spectera hex color or Companion colorpicker value to a Companion bgcolor number. */
export function toCompanionColor(color: InputValue | undefined): number | undefined {
	const hex = normalizeHexColor(color)
	if (!hex.startsWith('#') || hex.length < 7) return undefined

	const r = parseInt(hex.slice(1, 3), 16)
	const g = parseInt(hex.slice(3, 5), 16)
	const b = parseInt(hex.slice(5, 7), 16)
	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return undefined

	return combineRgb(r, g, b)
}

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

export type AudioOutputInterfaceId = (typeof audioOutputChannelChoices)[number]['id']
export type AudioOutputCommandContext = 'disabled' | 'enabled'

/**
 * Maps the config-stable interface selector IDs (kept from the pre-AoIP module) to the API 18.0
 * audio-output properties. Each interface now has two properties: one for when the Command button
 * feature is disabled (`On`/`Off` routing) and one for when it is enabled (`On`/`Off`/`Mute`/`Talk`).
 */
export const audioOutputInterfaceProps: Record<
	AudioOutputInterfaceId,
	Record<AudioOutputCommandContext, keyof import('./types.js').AudioOutput>
> = {
	commandModeAudioNetwork: { disabled: 'aoIpEnableIfCommandIsDisabled', enabled: 'aoIpEnableIfCommandIsEnabled' },
	commandModeMadi1: { disabled: 'madi1EnableIfCommandIsDisabled', enabled: 'madi1EnableIfCommandIsEnabled' },
	commandModeMadi2: { disabled: 'madi2EnableIfCommandIsDisabled', enabled: 'madi2EnableIfCommandIsEnabled' },
}

export const audioOutputCommandContextChoices = [
	{ id: 'disabled', label: 'Disabled' },
	{ id: 'enabled', label: 'Enabled' },
] as const

/** Full set of output states. On/Off apply to both contexts; Mute/Talk only to the enabled context. */
export const audioOutputStateChoices = [
	{ id: 'On', label: 'On' },
	{ id: 'Off', label: 'Off' },
	{ id: 'Mute', label: 'Mute (Command Mode Enabled)' },
	{ id: 'Talk', label: 'Talk (Command Mode Enabled)' },
] as const

export const rfChannelChoices = [
	{ label: 'RF Channel 1', id: 0 },
	{ label: 'RF Channel 2', id: 1 },
]

export const CONFIRMABLE_ACTIONS = [
	{ id: 'setAudioInputInterface', label: 'Audio Input Interface' },
	{ id: 'setAudioOutputInterface', label: 'Audio Output Interface' },
	{ id: 'copyAllMobileDeviceSettings', label: 'Copy All Mobile Device Settings' },
	{ id: 'dadRfBinding', label: 'DAD RF Binding' },
	{ id: 'rfFrequency', label: 'RF Frequency' },
	{ id: 'setRfChannelState', label: 'RF - State' },
] as const

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
