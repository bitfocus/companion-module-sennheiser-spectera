import { combineRgb } from '@companion-module/base'
import { SpecteraState } from './state.js'
import { AudioInput, MtType } from './types.js'

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

export function getMobileDeviceChoices(state: SpecteraState, filterType?: MtType): { id: number; label: string }[] {
	const choices: { id: number; label: string }[] = []
	for (const device of state.mobileDevices.values()) {
		if (!filterType || device.type === filterType) {
			choices.push({ id: device.mtUid, label: `${device.name} (${device.serial})` })
		}
	}

	choices.sort((a, b) => a.label.localeCompare(b.label))

	if (choices.length === 0) {
		choices.push({ id: 0, label: 'No Devices Found' })
	}
	return choices
}

export function getAudioLinkChoices(state: SpecteraState): { id: number; label: string }[] {
	const choices: { id: number; label: string }[] = []
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
	}

	// Sort choices by ID (which is input ID)
	choices.sort((a, b) => a.id - b.id)

	return choices
}
