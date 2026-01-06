import type { SpecteraInstance } from './main.js'

export function UpdateVariableDefinitions(self: SpecteraInstance): void {
	self.setVariableDefinitions([{ variableId: 'device_state', name: 'Current state of the basestation' }])
}
