import { combineRgb } from '@companion-module/base'
import { SpecteraState } from './state.js'
import { Antenna, MobileDevice, MtType, RfChannel, RFChannels } from './types.js'

export const Color = {
	Black: combineRgb(0, 0, 0),
	White: combineRgb(255, 255, 255),
	SpecteraDarkGray: combineRgb(40, 41, 46),
	SpecteraLightGray: combineRgb(46, 48, 54),
	SpecteraRed: combineRgb(225, 82, 65),
	SpecteraGreen: combineRgb(123, 185, 114),
	SpecteraBlue: combineRgb(65, 148, 209),
	SpecteraOrange: combineRgb(242, 170, 70),
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

export function getAudioLinkChoices(state: SpecteraState): { id: number; label: string }[] {
	const choices: { id: number; label: string }[] = []
	/*
	const inputsByLink = new Map<number, AudioInput[]>()
	const activeInputIds = new Set<number>()
	
		// Group inputs by audio link
		for (const input of state.audioInputs.values()) {
			if (!inputsByLink.has(input.iemAudiolinkId)) {
				inputsByLink.set(input.iemAudiolinkId, [])
			}
			inputsByLink.get(input.iemAudiolinkId)?.push(input)
		}
	
		// Process Active Links
		for (const link of state.audioLinks.values()) {
			const inputs = inputsByLink.get(link.audiolinkId) || []
			if (inputs.length === 0) continue
	
			// Sort inputs by inputId to ensure deterministic order (1st input is lowest ID)
			inputs.sort((a, b) => a.inputId - b.inputId)
	
			const firstInputId = inputs[0].inputId
			inputs.forEach((i) => activeInputIds.add(i.inputId))
	
			const label = inputs.map((i) => i.name || `Input ${i.inputId + 1}`).join(' & ')
	
			choices.push({
				id: firstInputId,
				label: `[ACTIVE] ${label}`,
			})
		}
	
		// Process Free Inputs
		const allInputs = Array.from(state.audioInputs.values()).sort((a, b) => a.inputId - b.inputId)
		for (const input of allInputs) {
			if (!activeInputIds.has(input.inputId)) {
				choices.push({
					id: input.inputId,
					label: input.name || `Input ${input.inputId + 1}`,
				})
			}
		} */

	state.audioInputs.forEach((input) => {
		choices.push({
			id: input.inputId,
			label: input.name || `Input ${input.inputId + 1}`,
		})
	})

	// Sort choices by ID (which is input ID)
	choices.sort((a, b) => a.id - b.id)

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
