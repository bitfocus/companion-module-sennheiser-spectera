import { describe, expect, it } from 'vitest'
import { SpecteraApi } from '../../src/api.js'
import { SpecteraState } from '../../src/state.js'
import {
	AntennaPortId,
	AudiolinkModeId,
	BandwidthMode,
	InputSource,
	InterfaceInputStatus,
	MtType,
	PsuStatus,
	RfState,
	RfStateStartup,
	TempStatus,
	TxPower,
} from '../../src/types.js'
import type SpecteraInstance from '../../src/main.js'

const host = process.env.SPECTERA_HOST
const password = process.env.SPECTERA_PASSWORD
const live = Boolean(host && password)

function makeLiveApi(): SpecteraApi {
	const instance = {
		log: () => undefined,
		checkFeedbacks: () => undefined,
		setVariableValues: () => undefined,
	} as unknown as SpecteraInstance
	return new SpecteraApi(instance, new SpecteraState(), host!, password!)
}

describe.skipIf(!live)('live Spectera API contract', () => {
	it('reports a compatible SSC schema', async () => {
		const api = makeLiveApi()
		try {
			const version = await api.getSscVersion()
			expect(version).toMatchObject({ protocol: expect.any(String), schema: expect.stringMatching(/^18\./) })
			expect(version.schemaDetailed).toEqual(expect.any(String))
		} finally {
			await api.disconnect()
		}
	})

	it('returns the expected fixed hardware resources and valid enum values', async () => {
		const api = makeLiveApi()
		try {
			const [inputs, outputs, channels, antennas] = await Promise.all([
				api.getAudioInputs(),
				api.getAudioOutputs(),
				api.getRfChannels(),
				api.getAntennas(),
			])

			expect(inputs).toHaveLength(32)
			expect(outputs).toHaveLength(32)
			expect(channels).toHaveLength(2)
			expect(antennas).toHaveLength(4)
			expect(inputs.map((input) => input.inputId)).toEqual([...Array(32).keys()])
			expect(outputs.map((output) => output.outputId)).toEqual([...Array(32).keys()])
			for (const input of inputs) {
				expect(Object.values(InputSource)).toContain(input.inputSource)
				expect(input.iemAudiolinkId).toBeGreaterThanOrEqual(-1)
				expect(input.iemAudiolinkId).toBeLessThanOrEqual(255)
			}
			for (const output of outputs) {
				expect(output.micAudiolinkId).toBeGreaterThanOrEqual(-1)
				expect(output.micAudiolinkId).toBeLessThanOrEqual(255)
			}
			for (const channel of channels) {
				expect(channel.rfChannelId).toBeGreaterThanOrEqual(0)
				expect(channel.rfChannelId).toBeLessThanOrEqual(1)
				expect(Object.values(TxPower)).toContain(channel.txPower)
				expect(Object.values(BandwidthMode)).toContain(channel.bandwidthMode)
				expect(Object.values(RfState)).toContain(channel.rfState)
				expect(Object.values(RfStateStartup)).toContain(channel.rfStateOnStartup)
				expect(channel.frequency).toBeGreaterThanOrEqual(10000)
				expect(channel.frequency).toBeLessThanOrEqual(10000000)
				expect(channel.frequency % 1000).toBe(0)
			}
			expect(antennas.map((antenna) => antenna.antennaPortId).sort()).toEqual(Object.values(AntennaPortId).sort())
		} finally {
			await api.disconnect()
		}
	})

	it('keeps every active audio-link reference resolvable', async () => {
		const api = makeLiveApi()
		try {
			const [inputs, outputs, devices, links] = await Promise.all([
				api.getAudioInputs(),
				api.getAudioOutputs(),
				api.getMobileDevices(),
				api.getAudioLinks(),
			])
			const linkIds = new Set(links.map((link) => link.audiolinkId))
			expect(linkIds.size).toBe(links.length)
			for (const link of links) {
				expect(link.audiolinkId).toBeGreaterThanOrEqual(0)
				expect(link.audiolinkId).toBeLessThanOrEqual(255)
				expect(Object.values(AudiolinkModeId)).toContain(link.modeId)
			}
			const references = [
				...inputs.map((input) => input.iemAudiolinkId),
				...outputs.map((output) => output.micAudiolinkId),
				...devices.flatMap((device) =>
					device.type === MtType.SEK ? [device.micAudiolinkId, device.iemAudiolinkId] : [device.micAudiolinkId],
				),
			].filter((id): id is number => id !== undefined && id >= 0)

			for (const id of references) expect(linkIds, `missing audio link ${id}`).toContain(id)
			for (const device of devices) {
				expect(device.mtUid).toBeGreaterThanOrEqual(0)
				expect(device.mtUid).toBeLessThanOrEqual(4294967295)
				expect(device.micAudiolinkId).toBeGreaterThanOrEqual(-1)
				expect(device.micAudiolinkId).toBeLessThanOrEqual(255)
				expect(device.batteryFillLevel).toBeGreaterThanOrEqual(-1)
				expect(device.batteryFillLevel).toBeLessThanOrEqual(100)
				expect(device.batteryRuntime).toBeGreaterThanOrEqual(-1)
				expect(device.batteryRuntime).toBeLessThanOrEqual(65535)
				expect(device.micLqi).toBeGreaterThanOrEqual(0)
				expect(device.micLqi).toBeLessThanOrEqual(4)
				expect(device.rssi).toBeGreaterThanOrEqual(-138)
				expect(device.rssi).toBeLessThanOrEqual(30)
				if (device.type === MtType.SEK) {
					expect(device.iemAudiolinkId).toBeGreaterThanOrEqual(-1)
					expect(device.iemAudiolinkId).toBeLessThanOrEqual(255)
					expect(device.iemLqi).toBeGreaterThanOrEqual(0)
					expect(device.iemLqi).toBeLessThanOrEqual(4)
				}
			}
		} finally {
			await api.disconnect()
		}
	})

	it('returns complete health, metering, and interface status payloads', async () => {
		const api = makeLiveApi()
		try {
			const [psu, temp, fans, levels, aoip, madi1, madi2, wordclock] = await Promise.all([
				api.getHealthPsu(),
				api.getHealthTempOverall(),
				Promise.all(['FAN_1', 'FAN_2', 'FAN_3'].map(async (fan) => api.getHealthFan(fan))),
				api.getAudioLevels(),
				api.getAudioNetworkStatus(),
				api.getMadiStatus('madi1'),
				api.getMadiStatus('madi2'),
				api.getWordclockStatus(),
			])

			expect(Object.values(PsuStatus)).toContain(psu.psu1)
			expect(Object.values(PsuStatus)).toContain(psu.psu2)
			expect(Object.values(TempStatus)).toContain(temp.value)
			for (const [index, fan] of fans.entries()) {
				expect(fan).toEqual({
					fanId: `FAN_${index + 1}`,
					errorState: { value: expect.stringMatching(/^(Ok|Error_1|Error_2|Broken)$/) },
				})
			}
			expect(levels.updateCounter).toEqual(expect.any(Number))
			expect(levels.updateCounter).toBeGreaterThanOrEqual(0)
			expect(levels.updateCounter).toBeLessThanOrEqual(255)
			for (const level of [levels.aoIpIn, levels.aoIpOut, levels.madi1In, levels.madi1Out]) {
				expect(level?.peak).toHaveLength(32)
				expect(level?.rms).toHaveLength(32)
				for (const value of [...(level?.peak ?? []), ...(level?.rms ?? [])]) {
					expect(value).toBeGreaterThanOrEqual(-127.5)
					expect(value).toBeLessThanOrEqual(0)
					expect(value * 2).toBe(Math.trunc(value * 2))
				}
			}
			for (const status of [
				aoip.status,
				madi1.inputStatus.status,
				madi1.outputStatus.clockSourceStatus,
				madi2.inputStatus.status,
				madi2.outputStatus.clockSourceStatus,
				wordclock.inputStatus.status,
				wordclock.outputStatus.clockSourceStatus,
			]) {
				expect(Object.values(InterfaceInputStatus)).toContain(status)
			}
		} finally {
			await api.disconnect()
		}
	})
})
