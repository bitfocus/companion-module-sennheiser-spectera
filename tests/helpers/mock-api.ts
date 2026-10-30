import { vi, type Mock } from 'vitest'
import type SpecteraInstance from '../../src/main.js'
import { SpecteraApi } from '../../src/api.js'
import { SpecteraState } from '../../src/state.js'

export interface MockSpecteraInstance {
	log: Mock
	checkFeedbacks: Mock
	setVariableValues: Mock
	updateStatus: Mock
}

export function makeApi(): {
	api: SpecteraApi
	state: SpecteraState
	instance: MockSpecteraInstance
} {
	const state = new SpecteraState()
	const instance: MockSpecteraInstance = {
		log: vi.fn(),
		checkFeedbacks: vi.fn(),
		setVariableValues: vi.fn(),
		updateStatus: vi.fn(),
	}
	const api = new SpecteraApi(instance as unknown as SpecteraInstance, state, '192.0.2.1', 'password')
	return { api, state, instance }
}
