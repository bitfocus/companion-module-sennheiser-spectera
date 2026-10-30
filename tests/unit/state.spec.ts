import { describe, expect, it } from 'vitest'
import { SpecteraState } from '../../src/state.js'
import { makeMobileDevice } from '../fixtures/devices.js'

describe('SpecteraState', () => {
	it('updates and removes dynamic resources', () => {
		const state = new SpecteraState()
		const device = makeMobileDevice()
		state.updateMobileDevice(device)
		expect(state.mobileDevices.get(device.mtUid)).toBe(device)

		state.removeMobileDevice(device.mtUid)
		expect(state.mobileDevices.has(device.mtUid)).toBe(false)
	})

	it('clears device structure while preserving health and interface state', () => {
		const state = new SpecteraState()
		state.updateMobileDevice(makeMobileDevice())
		state.iemLinkPrimaryByInputId.set(0, 'SEK 1')
		const initialHealth = state.health

		state.clear()

		expect(state.mobileDevices).toHaveLength(0)
		expect(state.iemLinkPrimaryByInputId).toHaveLength(0)
		expect(state.health).toBe(initialHealth)
	})

	it('replaces audio metering state atomically', () => {
		const state = new SpecteraState()
		const levels = { updateCounter: 5 }
		state.updateAudioLevels(levels)
		expect(state.audioLevels).toBe(levels)
	})
})
