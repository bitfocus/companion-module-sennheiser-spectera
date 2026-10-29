import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	host: string
}

export type ModuleSecrets = {
	password: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'Sennheiser Spectera',
			width: 12,
			value: `This module version is compatible with **Spectera firmware version 1.5.0** or newer.`,
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Base Station IP',
			width: 8,
			regex: Regex.IP,
		},
		{
			type: 'secret-text',
			id: 'password',
			label: 'Password',
			width: 4,
			default: '',
		},
	]
}
