import { describe, expect, it, vi } from 'vitest'
import { AudiolinkModeId, MtType, type AudioLink } from '../../src/types.js'
import { makeAudioInput, makeAudioOutput, makeSekDevice, makeSkmDevice } from '../fixtures/devices.js'
import { makeApi } from '../helpers/mock-api.js'

describe('audio-link cleanup', () => {
	it.each([undefined, -1])('ignores inactive link id %s', async (linkId) => {
		const { api } = makeApi()
		const deleteLink = vi.spyOn(api, 'deleteAudioLink').mockResolvedValue()

		await api.cleanupAudioLink(linkId)

		expect(deleteLink).not.toHaveBeenCalled()
	})

	it('leaves links referenced by another output in place', async () => {
		const { api, state, instance } = makeApi()
		state.updateAudioOutput(makeAudioOutput({ outputId: 1, micAudiolinkId: 20 }))
		const deleteLink = vi.spyOn(api, 'deleteAudioLink').mockResolvedValue()

		await api.cleanupAudioLink(20, {}, 'Test cleanup')

		expect(deleteLink).not.toHaveBeenCalled()
		expect(instance.log).toHaveBeenCalledWith('debug', 'Test cleanup: link 20 still in use, leaving in place')
	})

	it('unlinks stale device references before deleting an abandoned link', async () => {
		const { api, state } = makeApi()
		const device = makeSkmDevice({ mtUid: 7, micAudiolinkId: 20 })
		state.updateMobileDevice(device)
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()
		const deleteLink = vi.spyOn(api, 'deleteAudioLink').mockResolvedValue()

		await api.cleanupAudioLink(20)

		expect(setDevice).toHaveBeenCalledWith(7, { micAudiolinkId: -1 })
		expect(deleteLink).toHaveBeenCalledWith(20)
		expect(device.micAudiolinkId).toBe(-1)
		expect(setDevice.mock.invocationCallOrder[0]).toBeLessThan(deleteLink.mock.invocationCallOrder[0])
	})

	it('logs unlink and deletion failures without rejecting cleanup', async () => {
		const { api, state, instance } = makeApi()
		state.updateMobileDevice(makeSkmDevice({ mtUid: 7, micAudiolinkId: 20 }))
		vi.spyOn(api, 'setMobileDevice').mockRejectedValue(new Error('offline'))
		vi.spyOn(api, 'deleteAudioLink').mockRejectedValue(new Error('busy'))

		await expect(api.cleanupAudioLink(20, {}, 'Recovery')).resolves.toBeUndefined()
		expect(instance.log).toHaveBeenCalledWith('warn', 'Recovery: failed to unlink device 7 from abandoned link 20')
		expect(instance.log).toHaveBeenCalledWith('warn', 'Recovery: failed to delete abandoned audio link 20: busy')
	})
})

describe('IEM input routing', () => {
	it('creates a link, assigns the input, then assigns the SEK device', async () => {
		const { api, state } = makeApi()
		state.updateAudioInput(makeAudioInput({ inputId: 3 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 8, rfChannelId: 1 }))
		const createLink = vi.spyOn(api, 'createAudioLink').mockResolvedValue(30)
		const setInput = vi.spyOn(api, 'setAudioInput').mockResolvedValue()
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()

		await api.routeAudioInputToMobileDevice(3, 8, AudiolinkModeId['LIVE (Stereo)'])

		expect(createLink).toHaveBeenCalledWith({
			modeId: AudiolinkModeId['LIVE (Stereo)'],
			rfChannelId: 1,
			linkedMt: { type: 'iem', mtUid: 8 },
		})
		expect(setInput).toHaveBeenCalledWith(3, { iemAudiolinkId: 30 })
		expect(setDevice).toHaveBeenCalledWith(8, { iemAudiolinkId: 30 })
		expect(createLink.mock.invocationCallOrder[0]).toBeLessThan(setInput.mock.invocationCallOrder[0])
		expect(setInput.mock.invocationCallOrder[0]).toBeLessThan(setDevice.mock.invocationCallOrder[0])
	})

	it('does not create a link when the device has no RF channel', async () => {
		const { api, state, instance } = makeApi()
		state.updateAudioInput(makeAudioInput())
		state.updateMobileDevice(makeSekDevice({ rfChannelId: undefined }))
		const createLink = vi.spyOn(api, 'createAudioLink').mockResolvedValue(30)

		await api.routeAudioInputToMobileDevice(0, 1, AudiolinkModeId['LIVE (Stereo)'])

		expect(createLink).not.toHaveBeenCalled()
		expect(instance.log).toHaveBeenCalledWith('warn', 'Audio Routing: Mobile Device has no RF Channel assigned')
	})

	it('stops before assigning the device when input assignment fails after link creation', async () => {
		const { api, state, instance } = makeApi()
		state.updateAudioInput(makeAudioInput({ inputId: 3 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 8, rfChannelId: 1 }))
		vi.spyOn(api, 'createAudioLink').mockResolvedValue(30)
		vi.spyOn(api, 'setAudioInput').mockRejectedValue(new Error('input rejected'))
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await api.routeAudioInputToMobileDevice(3, 8, AudiolinkModeId['LIVE (Stereo)'])

		expect(setDevice).not.toHaveBeenCalled()
		expect(cleanup).toHaveBeenCalledWith(30, {}, 'Audio Routing rollback')
		expect(instance.log).toHaveBeenCalledWith(
			'error',
			'Audio Routing: Failed to create Audio Link: Error: input rejected',
		)
	})

	it('reuses an input link and cleans up the device previous IEM link first', async () => {
		const { api, state } = makeApi()
		state.updateAudioInput(makeAudioInput({ inputId: 3, iemAudiolinkId: 30 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 8, rfChannelId: 1, iemAudiolinkId: 20 }))
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()

		await api.routeAudioInputToMobileDevice(3, 8, AudiolinkModeId['LIVE (Stereo)'])

		expect(cleanup).toHaveBeenCalledWith(20, { mobileDeviceUids: new Set([8]) }, 'Audio Routing')
		expect(setDevice).toHaveBeenCalledWith(8, { iemAudiolinkId: 30 })
		expect(cleanup.mock.invocationCallOrder[0]).toBeLessThan(setDevice.mock.invocationCallOrder[0])
	})

	it('detaches the device from a shared IEM link before creating a new one', async () => {
		const { api, state } = makeApi()
		state.updateAudioInput(makeAudioInput({ inputId: 3 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 8, serial: 'SEK-008', rfChannelId: 1, iemAudiolinkId: 20 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 9, serial: 'SEK-009', rfChannelId: 1, iemAudiolinkId: 20 }))
		const deleteLink = vi.spyOn(api, 'deleteAudioLink').mockResolvedValue()
		const createLink = vi.spyOn(api, 'createAudioLink').mockResolvedValue(30)
		vi.spyOn(api, 'setAudioInput').mockResolvedValue()
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()

		await api.routeAudioInputToMobileDevice(3, 8, AudiolinkModeId['LIVE (Mono)'])

		expect(deleteLink).not.toHaveBeenCalled()
		expect(setDevice).toHaveBeenNthCalledWith(1, 8, { iemAudiolinkId: -1 })
		expect(setDevice.mock.invocationCallOrder[0]).toBeLessThan(createLink.mock.invocationCallOrder[0])
		expect(setDevice).toHaveBeenLastCalledWith(8, { iemAudiolinkId: 30 })
		expect(state.mobileDevices.get(9)?.type === MtType.SEK && state.mobileDevices.get(9)?.iemAudiolinkId).toBe(20)
	})

	it('serializes a double press so the second route reuses the first link', async () => {
		const { api, state, instance } = makeApi()
		state.updateAudioInput(makeAudioInput({ inputId: 3 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 8, rfChannelId: 1, iemAudiolinkId: 20 }))
		const createLink = vi.spyOn(api, 'createAudioLink').mockResolvedValue(30)
		vi.spyOn(api, 'setAudioInput').mockResolvedValue()
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await Promise.all([
			api.routeAudioInputToMobileDevice(3, 8, AudiolinkModeId['LIVE (Mono)']),
			api.routeAudioInputToMobileDevice(3, 8, AudiolinkModeId['LIVE (Mono)']),
		])

		expect(createLink).toHaveBeenCalledTimes(1)
		expect(cleanup).toHaveBeenCalledTimes(1)
		expect(setDevice).toHaveBeenLastCalledWith(8, { iemAudiolinkId: 30 })
		expect(state.audioInputs.get(3)?.iemAudiolinkId).toBe(30)
		expect(instance.setVariableValues).toHaveBeenCalledWith(expect.objectContaining({ audio_input_4_iem_link_id: 30 }))
	})

	it('serializes Copy IEM Mix with routing so the copy sees the routed link', async () => {
		const { api, state } = makeApi()
		state.updateAudioInput(makeAudioInput({ inputId: 3 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 8, serial: 'SEK-008', rfChannelId: 1 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 9, serial: 'SEK-009', rfChannelId: 1 }))
		vi.spyOn(api, 'createAudioLink').mockResolvedValue(30)
		vi.spyOn(api, 'setAudioInput').mockResolvedValue()
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()

		await Promise.all([
			api.routeAudioInputToMobileDevice(3, 8, AudiolinkModeId['LIVE (Mono)']),
			api.copyIemAudioLink(8, 9),
		])

		expect(setDevice).toHaveBeenLastCalledWith(9, { iemAudiolinkId: 30 })
	})
})

describe('microphone output routing', () => {
	it('reuses an existing link and updates its mode only when needed', async () => {
		const { api, state } = makeApi()
		const device = makeSkmDevice({ mtUid: 4, micAudiolinkId: 40 })
		const output = makeAudioOutput({ outputId: 2 })
		state.updateMobileDevice(device)
		state.updateAudioOutput(output)
		state.updateAudioLink({
			audiolinkId: 40,
			rfChannelId: 0,
			modeId: AudiolinkModeId['RAW (Mono)'],
		} satisfies AudioLink)
		const createLink = vi.spyOn(api, 'createAudioLink').mockResolvedValue(99)
		const updateLink = vi.spyOn(api, 'updateAudioLink').mockResolvedValue()
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()
		const setOutput = vi.spyOn(api, 'setAudioOutput').mockResolvedValue()

		await api.routeMobileDeviceToAudioOutput(4, 2, AudiolinkModeId['RAW Low Latency (Mono)'])

		expect(createLink).not.toHaveBeenCalled()
		expect(updateLink).toHaveBeenCalledWith({
			audiolinkId: 40,
			modeId: AudiolinkModeId['RAW Low Latency (Mono)'],
		})
		expect(setDevice).not.toHaveBeenCalled()
		expect(setOutput).toHaveBeenCalledWith(2, { micAudiolinkId: 40 })
		expect(output.micAudiolinkId).toBe(40)
	})

	it('creates and assigns a new link to both device and output', async () => {
		const { api, state } = makeApi()
		const device = makeSkmDevice({ mtUid: 4, micAudiolinkId: -1, rfChannelId: 0 })
		const output = makeAudioOutput({ outputId: 2 })
		state.updateMobileDevice(device)
		state.updateAudioOutput(output)
		const createLink = vi.spyOn(api, 'createAudioLink').mockResolvedValue(41)
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()
		const setOutput = vi.spyOn(api, 'setAudioOutput').mockResolvedValue()

		await api.routeMobileDeviceToAudioOutput(4, 2, AudiolinkModeId['RAW (Mono)'])

		expect(createLink).toHaveBeenCalledWith({
			modeId: AudiolinkModeId['RAW (Mono)'],
			rfChannelId: 0,
			linkedMt: { type: 'mic', mtUid: 4 },
		})
		expect(setDevice).toHaveBeenCalledWith(4, { micAudiolinkId: 41 })
		expect(setOutput).toHaveBeenCalledWith(2, { micAudiolinkId: 41 })
		expect(device.micAudiolinkId).toBe(41)
		expect(output.micAudiolinkId).toBe(41)
	})

	it('does not delete a replaced link that another output still uses', async () => {
		const { api, state } = makeApi()
		state.updateMobileDevice(makeSkmDevice({ mtUid: 4, micAudiolinkId: 41 }))
		state.updateAudioOutput(makeAudioOutput({ outputId: 2, micAudiolinkId: 40 }))
		state.updateAudioOutput(makeAudioOutput({ outputId: 3, micAudiolinkId: 40 }))
		state.updateAudioLink({
			audiolinkId: 41,
			rfChannelId: 0,
			modeId: AudiolinkModeId['RAW (Mono)'],
		})
		const deleteLink = vi.spyOn(api, 'deleteAudioLink').mockResolvedValue()
		vi.spyOn(api, 'setAudioOutput').mockResolvedValue()

		await api.routeMobileDeviceToAudioOutput(4, 2, AudiolinkModeId['RAW (Mono)'])

		expect(deleteLink).not.toHaveBeenCalled()
	})

	it('does not treat IEM references as microphone output ownership', () => {
		const { api, state } = makeApi()
		state.updateMobileDevice(makeSekDevice({ type: MtType.SEK, iemAudiolinkId: 55 }))
		expect(api.isAudioLinkAbandoned(55)).toBe(false)
	})

	it('continues assigning the output when assigning the device fails', async () => {
		const { api, state, instance } = makeApi()
		const device = makeSkmDevice({ mtUid: 4, micAudiolinkId: -1, rfChannelId: 0 })
		const output = makeAudioOutput({ outputId: 2 })
		state.updateMobileDevice(device)
		state.updateAudioOutput(output)
		vi.spyOn(api, 'createAudioLink').mockResolvedValue(41)
		vi.spyOn(api, 'setMobileDevice').mockRejectedValue(new Error('device rejected'))
		const setOutput = vi.spyOn(api, 'setAudioOutput').mockResolvedValue()

		await api.routeMobileDeviceToAudioOutput(4, 2, AudiolinkModeId['RAW (Mono)'])

		expect(setOutput).toHaveBeenCalledWith(2, { micAudiolinkId: 41 })
		expect(output.micAudiolinkId).toBe(41)
		expect(device.micAudiolinkId).toBe(-1)
		expect(instance.log).toHaveBeenCalledWith(
			'warn',
			'Audio Routing: Failed to assign Audio Link to Mobile Device: Error: device rejected',
		)
	})

	it('cleans up a newly created link when both device and output assignment fail', async () => {
		const { api, state } = makeApi()
		state.updateMobileDevice(makeSkmDevice({ mtUid: 4, micAudiolinkId: -1, rfChannelId: 0 }))
		state.updateAudioOutput(makeAudioOutput({ outputId: 2 }))
		vi.spyOn(api, 'createAudioLink').mockResolvedValue(41)
		vi.spyOn(api, 'setMobileDevice').mockRejectedValue(new Error('device rejected'))
		vi.spyOn(api, 'setAudioOutput').mockRejectedValue(new Error('output rejected'))
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await api.routeMobileDeviceToAudioOutput(4, 2, AudiolinkModeId['RAW (Mono)'])

		expect(cleanup).toHaveBeenCalledWith(41, {}, 'Audio Routing rollback')
	})
})

describe('copy settings recovery', () => {
	it('rejects missing and same-device copies before making writes', async () => {
		const { api, state, instance } = makeApi()
		state.updateMobileDevice(makeSekDevice({ mtUid: 1 }))
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()

		await api.copyMobileDeviceSettings(1, 99)
		await api.copyMobileDeviceSettings(1, 1)

		expect(setDevice).not.toHaveBeenCalled()
		expect(instance.log).toHaveBeenCalledWith('warn', 'Copy Settings: Source or Target Mobile Device not found')
		expect(instance.log).toHaveBeenCalledWith('warn', 'Copy Settings: Source and Target are the same device')
	})

	it('copies shared settings across device types and leaves SEK-only values out', async () => {
		const { api, state, instance } = makeApi()
		state.updateMobileDevice(
			makeSekDevice({ mtUid: 1, name: 'Source', micAudiolinkId: -1, headphoneVolume: -12, rfChannelId: 1 }),
		)
		state.updateMobileDevice(makeSkmDevice({ mtUid: 2, name: 'Target', micAudiolinkId: -1 }))
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()

		await api.copyMobileDeviceSettings(1, 2)

		expect(instance.log).toHaveBeenCalledWith(
			'info',
			'Copy Settings: Device types differ (SEK → SKM). Copying shared settings only; type-specific parameters are skipped.',
		)
		expect(setDevice).toHaveBeenCalledWith(
			2,
			expect.objectContaining({ name: 'Source', micAudiolinkId: -1, rfChannelId: 1 }),
		)
		expect(setDevice.mock.calls[0][1]).not.toHaveProperty('headphoneVolume')
	})

	it('logs a failed target application and does not run stale-link cleanup', async () => {
		const { api, state, instance } = makeApi()
		state.updateMobileDevice(makeSkmDevice({ mtUid: 1, name: 'Source', micAudiolinkId: -1 }))
		state.updateMobileDevice(makeSkmDevice({ mtUid: 2, name: 'Target', micAudiolinkId: 20 }))
		vi.spyOn(api, 'setMobileDevice').mockResolvedValueOnce().mockRejectedValueOnce(new Error('apply rejected'))
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await expect(api.copyMobileDeviceSettings(1, 2)).resolves.toBeUndefined()

		expect(cleanup).not.toHaveBeenCalled()
		expect(instance.log).toHaveBeenCalledWith('warn', 'Copy Settings: Failed to apply settings: Error: apply rejected')
	})

	it('preserves the old IEM link when assigning the copied mix fails', async () => {
		const { api, state, instance } = makeApi()
		state.updateMobileDevice(makeSekDevice({ mtUid: 1, rfChannelId: 0, iemAudiolinkId: 10 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 2, rfChannelId: 1, iemAudiolinkId: 20 }))
		vi.spyOn(api, 'setMobileDevice').mockRejectedValue(new Error('assign rejected'))
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await api.copyIemAudioLink(1, 2)

		expect(instance.log).toHaveBeenCalledWith(
			'warn',
			'Copy IEM Mix: Devices are on different RF Channels, this might fail',
		)
		expect(instance.log).toHaveBeenCalledWith(
			'warn',
			'Copy IEM Mix: Failed to assign Audio Link: Error: assign rejected',
		)
		expect(cleanup).not.toHaveBeenCalled()
	})

	it('copies all SEK settings in order and cleans both replaced target links', async () => {
		const { api, state } = makeApi()
		state.updateMobileDevice(
			makeSekDevice({
				mtUid: 1,
				name: 'Source',
				micAudiolinkId: 10,
				iemAudiolinkId: 11,
				headphoneVolume: -12,
				rfChannelId: 0,
			}),
		)
		state.updateMobileDevice(
			makeSekDevice({ mtUid: 2, name: 'Target', micAudiolinkId: 20, iemAudiolinkId: 21, rfChannelId: 0 }),
		)
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await api.copyMobileDeviceSettings(1, 2)

		expect(setDevice.mock.calls).toEqual([
			[2, { micAudiolinkId: -1 }],
			[1, { micAudiolinkId: -1 }],
			[2, { iemAudiolinkId: -1 }],
			[2, expect.objectContaining({ name: 'Source', micAudiolinkId: 10, headphoneVolume: -12 })],
			[2, { iemAudiolinkId: 11 }],
		])
		expect(cleanup).toHaveBeenCalledWith(20, { mobileDeviceUids: new Set([2]) }, 'Copy Settings')
		expect(cleanup).toHaveBeenCalledWith(21, { mobileDeviceUids: new Set([2]) }, 'Copy Settings')
	})
})

describe('audio-link mode changes', () => {
	it('rejects IEM mode changes for SKM devices and inactive SEK links', async () => {
		const { api, state, instance } = makeApi()
		state.updateMobileDevice(makeSkmDevice({ mtUid: 1 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 2, iemAudiolinkId: -1 }))
		const updateLink = vi.spyOn(api, 'updateAudioLink').mockResolvedValue()

		await api.setMobileDeviceAudioLinkMode(1, 'iem', AudiolinkModeId['LIVE (Stereo)'])
		await api.setMobileDeviceAudioLinkMode(2, 'iem', AudiolinkModeId['LIVE (Stereo)'])

		expect(updateLink).not.toHaveBeenCalled()
		expect(instance.log).toHaveBeenCalledWith('warn', 'Set Audio Link Mode: IEM link is only available on SEK devices')
		expect(instance.log).toHaveBeenCalledWith('warn', 'Set Audio Link Mode: No active IEM audio link on this device')
	})

	it('updates active mic and IEM link modes and absorbs device errors', async () => {
		const { api, state, instance } = makeApi()
		state.updateMobileDevice(makeSekDevice({ mtUid: 2, micAudiolinkId: 10, iemAudiolinkId: 11 }))
		const updateLink = vi.spyOn(api, 'updateAudioLink').mockResolvedValueOnce().mockRejectedValueOnce(new Error('busy'))

		await api.setMobileDeviceAudioLinkMode(2, 'mic', AudiolinkModeId['RAW (Mono)'])
		await api.setMobileDeviceAudioLinkMode(2, 'iem', AudiolinkModeId['LIVE (Stereo)'])

		expect(updateLink).toHaveBeenNthCalledWith(1, { audiolinkId: 10, modeId: AudiolinkModeId['RAW (Mono)'] })
		expect(updateLink).toHaveBeenNthCalledWith(2, { audiolinkId: 11, modeId: AudiolinkModeId['LIVE (Stereo)'] })
		expect(instance.log).toHaveBeenCalledWith('warn', 'Set Audio Link Mode: Failed to update IEM link: Error: busy')
	})
})

describe('unrouting and instrument switch', () => {
	it('removes an output route, updates local state, then cleans its old link', async () => {
		const { api, state } = makeApi()
		const output = makeAudioOutput({ outputId: 2, micAudiolinkId: 20 })
		state.updateAudioOutput(output)
		const setOutput = vi.spyOn(api, 'setAudioOutput').mockResolvedValue()
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await api.removeMobileDeviceFromOutput(2)

		expect(setOutput).toHaveBeenCalledWith(2, { micAudiolinkId: -1 })
		expect(output.micAudiolinkId).toBe(-1)
		expect(cleanup).toHaveBeenCalledWith(20, { audioOutputIds: new Set([2]) }, 'Remove Device from Output')
	})

	it('removes an SEK IEM route and ignores missing devices', async () => {
		const { api, state } = makeApi()
		const device = makeSekDevice({ mtUid: 2, iemAudiolinkId: 21 })
		state.updateMobileDevice(device)
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await api.removeIemAudioLinkFromDevice(99)
		await api.removeIemAudioLinkFromDevice(2)

		expect(setDevice).toHaveBeenCalledOnce()
		expect(device.iemAudiolinkId).toBe(-1)
		expect(cleanup).toHaveBeenCalledWith(21, { mobileDeviceUids: new Set([2]) }, 'Remove IEM Audio Link')
	})

	it('toggles an existing instrument route off without unassigning the source device', async () => {
		const { api, state } = makeApi()
		const device = makeSkmDevice({ mtUid: 4, name: 'Guitar', micAudiolinkId: 40 })
		const output = makeAudioOutput({ outputId: 2, micAudiolinkId: 40 })
		state.updateMobileDevice(device)
		state.updateAudioOutput(output)
		const setOutput = vi.spyOn(api, 'setAudioOutput').mockResolvedValue()
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await api.instrumentSwitchMobileDeviceToOutput(4, 2, 'toggle', AudiolinkModeId['LIVE (Mono)'], true)

		expect(setOutput).toHaveBeenCalledWith(2, { micAudiolinkId: -1 })
		expect(device.micAudiolinkId).toBe(40)
		expect(output.micAudiolinkId).toBe(-1)
		expect(cleanup).toHaveBeenCalledWith(
			40,
			{ audioOutputIds: new Set([2]), mobileDeviceUids: new Set([4]) },
			'Instrument Switch (Guitar → output 3)',
		)
	})

	it('preserves the mode of an existing output link when switching a new device on', async () => {
		const { api, state, instance } = makeApi()
		state.updateMobileDevice(makeSkmDevice({ mtUid: 4, name: 'Guitar', micAudiolinkId: -1, rfChannelId: 0 }))
		state.updateAudioOutput(makeAudioOutput({ outputId: 2, micAudiolinkId: 40 }))
		state.updateAudioLink({ audiolinkId: 40, rfChannelId: 0, modeId: AudiolinkModeId['RAW Low Latency (Mono)'] })
		const createLink = vi.spyOn(api, 'createAudioLink').mockResolvedValue(41)
		vi.spyOn(api, 'setMobileDevice').mockResolvedValue()
		vi.spyOn(api, 'setAudioOutput').mockResolvedValue()
		vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await api.instrumentSwitchMobileDeviceToOutput(4, 2, 'on', AudiolinkModeId['LIVE (Mono)'], true)

		expect(createLink).toHaveBeenCalledWith({
			modeId: AudiolinkModeId['RAW Low Latency (Mono)'],
			rfChannelId: 0,
			linkedMt: { type: 'mic', mtUid: 4 },
		})
		expect(instance.log).toHaveBeenCalledWith(
			'debug',
			'Instrument Switch: Guitar routed to output 3 (mode 11 from output link 40)',
		)
	})
})

describe('audio link ID zero regressions', () => {
	it('treats link 0 as active and deletes it when abandoned', async () => {
		const { api } = makeApi()
		const deleteLink = vi.spyOn(api, 'deleteAudioLink').mockResolvedValue()

		expect(api.isAudioLinkAbandoned(0)).toBe(true)
		await api.cleanupAudioLink(0)

		expect(deleteLink).toHaveBeenCalledWith(0)
	})

	it('routes an existing IEM input link 0 without creating a replacement', async () => {
		const { api, state } = makeApi()
		state.updateAudioInput(makeAudioInput({ inputId: 3, iemAudiolinkId: 0 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 8, rfChannelId: 1, iemAudiolinkId: -1 }))
		const createLink = vi.spyOn(api, 'createAudioLink').mockResolvedValue(99)
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()

		await api.routeAudioInputToMobileDevice(3, 8, AudiolinkModeId['LIVE (Stereo)'])

		expect(createLink).not.toHaveBeenCalled()
		expect(setDevice).toHaveBeenCalledWith(8, { iemAudiolinkId: 0 })
	})

	it('preserves link 0 returned by link creation through both IEM assignments', async () => {
		const { api, state } = makeApi()
		state.updateAudioInput(makeAudioInput({ inputId: 3, iemAudiolinkId: -1 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 8, rfChannelId: 1, iemAudiolinkId: -1 }))
		vi.spyOn(api, 'createAudioLink').mockResolvedValue(0)
		const setInput = vi.spyOn(api, 'setAudioInput').mockResolvedValue()
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()

		await api.routeAudioInputToMobileDevice(3, 8, AudiolinkModeId['LIVE (Stereo)'])

		expect(setInput).toHaveBeenCalledWith(3, { iemAudiolinkId: 0 })
		expect(setDevice).toHaveBeenCalledWith(8, { iemAudiolinkId: 0 })
	})

	it('reuses microphone link 0 and assigns it to an output', async () => {
		const { api, state } = makeApi()
		state.updateMobileDevice(makeSkmDevice({ mtUid: 4, micAudiolinkId: 0, rfChannelId: 0 }))
		state.updateAudioOutput(makeAudioOutput({ outputId: 2, micAudiolinkId: -1 }))
		state.updateAudioLink({ audiolinkId: 0, rfChannelId: 0, modeId: AudiolinkModeId['RAW (Mono)'] })
		const createLink = vi.spyOn(api, 'createAudioLink').mockResolvedValue(99)
		const setOutput = vi.spyOn(api, 'setAudioOutput').mockResolvedValue()

		await api.routeMobileDeviceToAudioOutput(4, 2, AudiolinkModeId['RAW (Mono)'])

		expect(createLink).not.toHaveBeenCalled()
		expect(setOutput).toHaveBeenCalledWith(2, { micAudiolinkId: 0 })
	})

	it('updates modes and removes routes for link 0', async () => {
		const { api, state } = makeApi()
		const device = makeSekDevice({ mtUid: 4, micAudiolinkId: 0, iemAudiolinkId: 0 })
		const output = makeAudioOutput({ outputId: 2, micAudiolinkId: 0 })
		state.updateMobileDevice(device)
		state.updateAudioOutput(output)
		const updateLink = vi.spyOn(api, 'updateAudioLink').mockResolvedValue()
		vi.spyOn(api, 'setAudioOutput').mockResolvedValue()
		const cleanup = vi.spyOn(api, 'cleanupAudioLink').mockResolvedValue()

		await api.setMobileDeviceAudioLinkMode(4, 'mic', AudiolinkModeId['RAW (Mono)'])
		await api.setMobileDeviceAudioLinkMode(4, 'iem', AudiolinkModeId['LIVE (Stereo)'])
		await api.removeMobileDeviceFromOutput(2)

		expect(updateLink).toHaveBeenNthCalledWith(1, { audiolinkId: 0, modeId: AudiolinkModeId['RAW (Mono)'] })
		expect(updateLink).toHaveBeenNthCalledWith(2, { audiolinkId: 0, modeId: AudiolinkModeId['LIVE (Stereo)'] })
		expect(cleanup).toHaveBeenCalledWith(0, { audioOutputIds: new Set([2]) }, 'Remove Device from Output')
	})

	it('copies link 0 instead of converting it to the no-link sentinel', async () => {
		const { api, state } = makeApi()
		state.updateMobileDevice(makeSekDevice({ mtUid: 1, micAudiolinkId: 0, iemAudiolinkId: 0 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 2, micAudiolinkId: -1, iemAudiolinkId: -1 }))
		const setDevice = vi.spyOn(api, 'setMobileDevice').mockResolvedValue()

		await api.copyMobileDeviceSettings(1, 2)

		expect(setDevice).toHaveBeenCalledWith(1, { micAudiolinkId: -1 })
		expect(setDevice).toHaveBeenCalledWith(2, expect.objectContaining({ micAudiolinkId: 0 }))
		expect(setDevice).toHaveBeenCalledWith(2, { iemAudiolinkId: 0 })
	})
})
