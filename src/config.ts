import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
}

export interface ModuleSecrets {
	password: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'Sennheiser Spectera',
			width: 12,
			value: `This module is compatible from **Spectera firmware version 1.3**.    
			

Please note, using many different link modes on the same RF channel and continually deleting and creating new link modes can in rare circumstances require Spectera to rearrange audio data causing a brief audio interruption in any connected device. In a future firmware update this will be addressed, until then please either avoid creating new and previously unused linkIDs during a production to avoid this interruption. `,
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
