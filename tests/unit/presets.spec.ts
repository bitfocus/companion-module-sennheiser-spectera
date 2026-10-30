import { describe, expect, it, vi } from 'vitest'
import { UpdatePresets } from '../../src/presets.js'
import { SpecteraState } from '../../src/state.js'
import { makeAudioInput, makeAudioOutput, makeSekDevice, makeSkmDevice } from '../fixtures/devices.js'

function generatePresets(state = new SpecteraState()) {
	const setPresetDefinitions = vi.fn()
	UpdatePresets({ state, setPresetDefinitions } as any)
	const [structure, presets] = setPresetDefinitions.mock.calls[0]
	return { structure, presets }
}

describe('preset generation', () => {
	it('builds stable sections and representative static controls', () => {
		const { structure, presets } = generatePresets()

		expect(structure.map((section: any) => section.id)).toEqual(
			expect.arrayContaining([
				'rf-configuration',
				'audio-inputs',
				'audio-outputs',
				'base-station',
				'audio-meters-dante',
				'audio-meters-madi-1',
				'audio-meters-madi-2',
			]),
		)
		expect(structure.map((section: any) => section.id)).not.toContain('audio-meters')
		expect(presets.rf0SetActive.steps[0].down[0]).toMatchObject({
			actionId: 'setRfChannelState',
			options: { rfChannel: 0 },
		})
		expect(presets.rf0BackupFrequency.feedbacks).toEqual(
			expect.arrayContaining([expect.objectContaining({ feedbackId: 'confirmPending' })]),
		)
	})

	it('generates mono and stereo meter banks with correct channel pairing', () => {
		const { presets } = generatePresets()
		const mono = presets.dante_inMeter1
		const stereo = presets.dante_inMeterStereo1

		expect(mono.elements[2]).toMatchObject({
			elementId: 'audioMeter',
			options: { channelMode: 'mono', ch2Level: '', ch2Peak: '' },
		})
		expect(stereo.elements[2]).toMatchObject({
			elementId: 'audioMeter',
			options: {
				channelMode: 'stereo',
				ch1Level: { value: '$(spectera:audio_level_dante_in_1_rms)' },
				ch2Level: { value: '$(spectera:audio_level_dante_in_2_rms)' },
			},
		})
		expect(presets.dante_outMeterStereo1).toBeUndefined()
		expect(presets.dante_inMeter32.elements[2].options).toMatchObject({
			channelMode: 'mono',
			ch1Level: { value: '$(spectera:audio_level_dante_in_32_rms)' },
		})
		expect(presets.dante_inMeter33).toBeUndefined()
		expect(presets.dante_inMeterStereo31.elements[2].options).toMatchObject({
			channelMode: 'stereo',
			ch1Level: { value: '$(spectera:audio_level_dante_in_31_rms)' },
			ch2Level: { value: '$(spectera:audio_level_dante_in_32_rms)' },
		})
		expect(presets.dante_outMeter32).toBeDefined()
		expect(presets.madi_1_inMeter32).toBeDefined()
		expect(presets.madi_2_outMeter32).toBeDefined()
	})

	it('puts each interface meter banks in its own section', () => {
		const { structure } = generatePresets()
		const section = structure.find((s: any) => s.id === 'audio-meters-madi-1')

		expect(section.name).toBe('Audio Meters - MADI 1')
		expect(section.definitions.map((group: any) => group.name)).toEqual([
			'MADI 1 IN - Meters (Mono)',
			'MADI 1 IN - Meters (Stereo)',
			'MADI 1 OUT - Meters (Mono)',
		])
		expect(section.definitions.flatMap((group: any) => group.presets)).toHaveLength(32 + 16 + 32)
	})

	it('uses current state to build routing and device-specific presets', () => {
		const state = new SpecteraState()
		state.updateAudioInput(makeAudioInput({ inputId: 3, name: 'Playback' }))
		state.updateAudioOutput(makeAudioOutput({ outputId: 5 }))
		state.updateMobileDevice(makeSekDevice({ mtUid: 10, serial: 'SEK-010', name: 'Artist' }))
		state.updateMobileDevice(makeSkmDevice({ mtUid: 11, serial: 'SKM-011', name: 'Host' }))

		const { presets } = generatePresets(state)

		expect(presets.audioInput3CurrentInterface.style.text).toContain('audio_input_4_interface')
		expect(presets['SEK_SEK-010_MicLinkMove_Source_5'].steps[0].down[0]).toMatchObject({
			actionId: 'instrumentSwitchMobileDeviceToOutput',
			options: { serial: 'SEK-010', outputId: 5, behavior: 'toggle' },
		})
		expect(presets['SEK_SEK-010_BackupMode_11'].feedbacks).toEqual(
			expect.arrayContaining([expect.objectContaining({ feedbackId: 'confirmPending' })]),
		)
		expect(presets['SEK_SEK-010_IEM_LQI']).toBeDefined()
		expect(presets['SKM_SKM-011_IEM_LQI']).toBeUndefined()
		expect(presets['SEK_SEK-010_StatusLayered']).toBeUndefined()
		expect(presets['SKM_SKM-011_StatusLayered'].elements[3].options.bars.value).toBe('$(spectera:SKM_SKM-011_mic_lqi)')
	})

	it('gives an SEK mic, mono IEM and stereo IEM status meters', () => {
		const state = new SpecteraState()
		state.updateMobileDevice(makeSekDevice({ mtUid: 10, serial: 'SEK-010', name: 'Artist' }))

		const { presets } = generatePresets(state)

		expect(presets['SEK_SEK-010_StatusLayeredMic'].elements[2].options).toMatchObject({
			channelMode: 'mono',
			ch1Level: { value: '$(spectera:SEK_SEK-010_mic_level_rms)' },
			ch2Level: '',
		})
		expect(presets['SEK_SEK-010_StatusLayeredMic'].elements[3].options.bars.value).toBe(
			'$(spectera:SEK_SEK-010_mic_lqi)',
		)
		expect(presets['SEK_SEK-010_StatusLayeredIem'].elements[2].options).toMatchObject({
			channelMode: 'mono',
			ch1Level: { value: '$(spectera:SEK_SEK-010_iem_level_rms)' },
			ch2Level: '',
		})
		expect(presets['SEK_SEK-010_StatusLayeredIemStereo'].elements[2].options).toMatchObject({
			channelMode: 'stereo',
			ch1Level: { value: '$(spectera:SEK_SEK-010_iem_level_rms)' },
			ch1Peak: { value: '$(spectera:SEK_SEK-010_iem_level_peak)' },
			ch2Level: { value: '$(spectera:SEK_SEK-010_iem_level_2_rms)' },
			ch2Peak: { value: '$(spectera:SEK_SEK-010_iem_level_2_peak)' },
		})
		expect(presets['SEK_SEK-010_StatusLayeredIemStereo'].elements[3].options.bars.value).toBe(
			'$(spectera:SEK_SEK-010_iem_lqi)',
		)
	})
})
