import { describe, expect, it, vi } from 'vitest'
import { InputSource } from '../../src/types.js'
import { makeApi } from '../helpers/mock-api.js'

describe('API response normalization', () => {
	it('keeps the canonical inputSource from current firmware', async () => {
		const { api } = makeApi()
		vi.spyOn(api, 'sendRequest').mockResolvedValue([
			{ inputId: 0, iemAudiolinkId: 1, source: 'dante', inputSource: InputSource.Dante, name: '' },
		])

		await expect(api.getAudioInputs()).resolves.toEqual([
			expect.objectContaining({ inputId: 0, inputSource: InputSource.Dante }),
		])
	})

	it.each([
		['dante', InputSource.Dante],
		['madi1', InputSource['MADI 1']],
		['madi2', InputSource['MADI 2']],
	])('normalizes the v16 source value %s to %s', async (source, expected) => {
		const { api } = makeApi()
		vi.spyOn(api, 'sendRequest').mockResolvedValue([{ inputId: 0, iemAudiolinkId: -1, source, name: '' }])

		await expect(api.getAudioInputs()).resolves.toEqual([expect.objectContaining({ inputSource: expected })])
	})

	it('wraps the live fan error-state payload with its requested fan ID', async () => {
		const { api } = makeApi()
		const request = vi.spyOn(api, 'sendRequest').mockResolvedValue({ value: 'Ok' })

		await expect(api.getHealthFan('FAN_2')).resolves.toEqual({
			fanId: 'FAN_2',
			errorState: { value: 'Ok' },
		})
		expect(request).toHaveBeenCalledWith('GET', '/health/fan/FAN_2/errorstate')
	})

	it('also accepts the alternate nested fan response shape', async () => {
		const { api } = makeApi()
		vi.spyOn(api, 'sendRequest').mockResolvedValue({ errorState: { value: 'Blocked' } })

		await expect(api.getHealthFan('FAN_1')).resolves.toEqual({
			fanId: 'FAN_1',
			errorState: { value: 'Blocked' },
		})
	})
})

describe('API write guards', () => {
	it('rejects audio input and output writes for resources absent from state', async () => {
		const { api } = makeApi()

		await expect(api.setAudioInput(31, { inputSource: InputSource.Dante })).rejects.toThrow('Audio input 31 not found')
		await expect(api.setAudioOutput(31, { micAudiolinkId: 2 })).rejects.toThrow('Audio output 31 not found')
	})
})
