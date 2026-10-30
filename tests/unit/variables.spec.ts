import { describe, expect, it } from 'vitest'
import { AudiolinkModeId, InputSource, type AudioLevels, type AudioLink } from '../../src/types.js'
import { getAudioOutputActiveChannels, getMobileDeviceLevelVariables } from '../../src/variables.js'
import { makeAudioInput, makeAudioOutput, makeSekDevice, makeSkmDevice } from '../fixtures/devices.js'

function makeAudioLinks(...links: AudioLink[]): Map<number, AudioLink> {
	return new Map(links.map((link) => [link.audiolinkId, link]))
}

describe('mobile device audio-level variables', () => {
	it('resolves both MIC and IEM metering when their active link ID is zero', () => {
		const device = makeSekDevice({ serial: 'ZERO', micAudiolinkId: 0, iemAudiolinkId: 0 })
		const outputs = new Map([
			[0, makeAudioOutput({ outputId: 0, micAudiolinkId: 0, aoIpEnableIfCommandIsDisabled: 'On' })],
		])
		const inputs = new Map([[0, makeAudioInput({ inputId: 0, iemAudiolinkId: 0, inputSource: InputSource.Dante })]])
		const levels: AudioLevels = {
			updateCounter: 1,
			aoIpOut: { rms: [-12], peak: [-6] },
			aoIpIn: { rms: [-20], peak: [-10] },
		}

		const links = makeAudioLinks({ audiolinkId: 0, rfChannelId: 0, modeId: AudiolinkModeId['LIVE (Mono)'] })

		expect(getMobileDeviceLevelVariables(device, outputs, inputs, links, levels)).toEqual({
			SEK_ZERO_mic_level_rms: -12,
			SEK_ZERO_mic_level_peak: -6,
			SEK_ZERO_iem_stereo: false,
			SEK_ZERO_iem_level_rms: -20,
			SEK_ZERO_iem_level_peak: -10,
			SEK_ZERO_iem_level_2_rms: -127.5,
			SEK_ZERO_iem_level_2_peak: -127.5,
		})
	})

	it('resolves routed MIC and IEM levels from their active interfaces', () => {
		const device = makeSekDevice({ serial: 'SEK-123', micAudiolinkId: 10, iemAudiolinkId: 20 })
		const outputs = new Map([
			[
				3,
				makeAudioOutput({
					outputId: 3,
					micAudiolinkId: 10,
					aoIpEnableIfCommandIsDisabled: 'Off',
					madi1EnableIfCommandIsDisabled: 'On',
					madi2EnableIfCommandIsDisabled: 'Off',
				}),
			],
		])
		const inputs = new Map([[1, makeAudioInput({ inputId: 1, iemAudiolinkId: 20, inputSource: InputSource.Dante })]])
		const levels: AudioLevels = {
			updateCounter: 1,
			madi1Out: { rms: [-1, -2, -3, -14], peak: [-1, -2, -3, -9] },
			aoIpIn: { rms: [-20, -24], peak: [-18, -21] },
		}

		const links = makeAudioLinks(
			{ audiolinkId: 10, rfChannelId: 0, modeId: AudiolinkModeId['RAW (Mono)'] },
			{ audiolinkId: 20, rfChannelId: 0, modeId: AudiolinkModeId['LIVE (Mono)'] },
		)

		expect(getMobileDeviceLevelVariables(device, outputs, inputs, links, levels)).toEqual({
			'SEK_SEK-123_mic_level_rms': -14,
			'SEK_SEK-123_mic_level_peak': -9,
			'SEK_SEK-123_iem_stereo': false,
			'SEK_SEK-123_iem_level_rms': -24,
			'SEK_SEK-123_iem_level_peak': -21,
			'SEK_SEK-123_iem_level_2_rms': -127.5,
			'SEK_SEK-123_iem_level_2_peak': -127.5,
		})
	})

	it('reads the right channel of a stereo IEM link from the implicit adjacent input', () => {
		const device = makeSekDevice({ serial: 'SEK-123', iemAudiolinkId: 20 })
		const inputs = new Map([[2, makeAudioInput({ inputId: 2, iemAudiolinkId: 20, inputSource: InputSource.Dante })]])
		const links = makeAudioLinks({ audiolinkId: 20, rfChannelId: 0, modeId: AudiolinkModeId['LIVE (Stereo)'] })
		const levels: AudioLevels = {
			updateCounter: 1,
			aoIpIn: { rms: [-40, -41, -22, -26], peak: [-38, -39, -18, -19] },
		}

		expect(getMobileDeviceLevelVariables(device, new Map(), inputs, links, levels)).toMatchObject({
			'SEK_SEK-123_iem_stereo': true,
			'SEK_SEK-123_iem_level_rms': -22,
			'SEK_SEK-123_iem_level_peak': -18,
			'SEK_SEK-123_iem_level_2_rms': -26,
			'SEK_SEK-123_iem_level_2_peak': -19,
		})
	})

	it('uses silence defaults when routes or metering data are unavailable', () => {
		const device = makeSekDevice({ serial: 'SEK-123', micAudiolinkId: 10, iemAudiolinkId: 20 })
		const outputs = new Map([[0, makeAudioOutput({ outputId: 4, micAudiolinkId: 10 })]])
		const inputs = new Map([[0, makeAudioInput({ inputId: 4, iemAudiolinkId: 20 })]])
		const levels: AudioLevels = {
			updateCounter: 1,
			aoIpOut: { rms: [-10], peak: [-5] },
			aoIpIn: { rms: [-20], peak: [-15] },
		}

		expect(getMobileDeviceLevelVariables(device, outputs, inputs, new Map(), levels)).toEqual({
			'SEK_SEK-123_mic_level_rms': -127.5,
			'SEK_SEK-123_mic_level_peak': -127.5,
			'SEK_SEK-123_iem_stereo': false,
			'SEK_SEK-123_iem_level_rms': -127.5,
			'SEK_SEK-123_iem_level_peak': -127.5,
			'SEK_SEK-123_iem_level_2_rms': -127.5,
			'SEK_SEK-123_iem_level_2_peak': -127.5,
		})
	})

	it('does not publish IEM level variables for an SKM', () => {
		const device = makeSkmDevice({ serial: 'SKM-123' })

		expect(getMobileDeviceLevelVariables(device, new Map(), new Map(), new Map(), undefined)).toEqual({
			'SKM_SKM-123_mic_level_rms': -127.5,
			'SKM_SKM-123_mic_level_peak': -127.5,
		})
	})
})

describe('audio output active-channel display', () => {
	it.each([
		[['Off', 'Off', 'Off'], 'None'],
		[['On', 'Off', 'Off'], 'Dante'],
		[['Off', 'On', 'On'], 'MADI 1, MADI 2'],
		[['On', 'On', 'On'], 'Dante, MADI 1, MADI 2'],
	] as const)('formats %j as %s', ([dante, madi1, madi2], expected) => {
		const output = makeAudioOutput({
			aoIpEnableIfCommandIsDisabled: dante,
			madi1EnableIfCommandIsDisabled: madi1,
			madi2EnableIfCommandIsDisabled: madi2,
		})

		expect(getAudioOutputActiveChannels(output)).toBe(expected)
	})
})
