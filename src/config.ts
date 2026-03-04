import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	/** How many Engineer Pack slots to create (presets and variables). */
	engineerPackCount?: number
	/** Serial numbers: newline- or comma-separated. Order = Pack 1, Pack 2, etc. */
	engineerPacks?: string
}

/** Effective number of engineer pack slots (clamped, with default). */
export function getEngineerPackCount(config: ModuleConfig): number {
	const n = config.engineerPackCount ?? 4
	return Math.min(32, Math.max(0, Number(n) || 4))
}

export interface ModuleSecrets {
	password: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 8,
			regex: Regex.IP,
		},
		{
			type: 'secret-text',
			id: 'password',
			label: 'Password',
			width: 4,
			default: 'Sennheiser1!',
		},
		{
			type: 'number',
			id: 'engineerPackCount',
			label: 'Number of Engineer Pack slots',
			width: 4,
			min: 0,
			max: 32,
			default: 0,
		},
		{
			type: 'textinput',
			multiline: true,
			id: 'engineerPacks',
			label: 'Engineer Pack serials',
			width: 8,
			description:
				'Serial numbers, separated by newlines or commas. First = Pack 1, second = Pack 2, etc. Add serials when you have the packs.',
			tooltip:
				'Engineer Mode uses fixed slots. Enter serials here to assign devices to each slot. You can set up pages first, then add serials later.',
		},
	]
}
