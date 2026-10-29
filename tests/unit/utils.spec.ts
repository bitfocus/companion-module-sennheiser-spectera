import { describe, expect, it } from 'vitest'
import {
	colorsMatch,
	formatBatteryRuntimeMinutes,
	getAntennaFrequency,
	getPortableMobileDeviceSettings,
	parseNumber,
	snapToStep,
	normalizeHexColor,
	parseMobileDeviceSettingsJson,
	sanitizeMobileDeviceName,
} from '../../src/utils.js'
import {
	AntennaPortId,
	DeviceStatus,
	MicLowCutHzSEK,
	MtType,
	RFChannels,
	type Antenna,
	type RfChannel,
} from '../../src/types.js'
import { makeSekDevice, makeSkmDevice } from '../fixtures/devices.js'

describe('color utilities', () => {
	it.each([
		[0xff0080, '#FF0080'],
		['#abc', '#AABBCC'],
		['#abcdef99', '#ABCDEF'],
		['rgb(1, 2, 255)', '#0102FF'],
		[' rgba(255, 0, 16, 0.5)', '#FF0010'],
	])('normalizes %j to %s', (input, expected) => {
		expect(normalizeHexColor(input)).toBe(expected)
	})

	it.each([undefined, null, '', true, [], {}])('rejects unsupported value %j', (input) => {
		expect(normalizeHexColor(input)).toBe('')
	})

	it('compares colors after normalization', () => {
		expect(colorsMatch('#aabbcc', '#ABC')).toBe(true)
		expect(colorsMatch('#aabbcc', '#AABB00')).toBe(false)
	})
})

describe('numeric option utilities', () => {
	it.each([
		[' -20.5 ', -20.5],
		[3, 3],
		['', undefined],
		['  ', undefined],
		['abc', undefined],
		[Number.NaN, undefined],
		[undefined, undefined],
	])('parses %j as %j', (raw, expected) => {
		expect(parseNumber(raw)).toBe(expected)
	})

	it.each([
		[-20.3, 0.5, -20.5],
		[-20.2, 0.5, -20],
		[520500, 1000, 521000],
		[30, 0.5, 27.5],
		[-130, 1, -100],
	])('snaps %d to step %d as %d', (value, step, expected) => {
		expect(snapToStep(value, step, -100, step === 1000 ? 10000000 : 27.5)).toBe(expected)
	})
})

describe('device setting utilities', () => {
	it('sanitizes and truncates device names', () => {
		expect(sanitizeMobileDeviceName('Valid Name! with extra')).toBe('Valid Name with ')
	})

	it('reports invalid JSON without producing a payload', () => {
		const result = parseMobileDeviceSettingsJson('{bad json', makeSekDevice())
		expect(result.payload).toEqual({})
		expect(result.error).toMatch(/^Invalid JSON:/)
	})

	it('validates, clamps, and filters imported SEK settings', () => {
		const result = parseMobileDeviceSettingsJson(
			JSON.stringify({
				type: MtType.SEK,
				name: 'Stage Vocal! 123456789',
				connectedStateColor: '#0a1b2c',
				micPreampGain: 100,
				headphoneVolume: -200,
				micLowCutHz: MicLowCutHzSEK['80 Hz'],
				identity: 'must not pass through',
			}),
			makeSekDevice(),
		)

		expect(result.payload).toEqual({
			name: 'Stage Vocal 1234',
			connectedStateColor: '#0A1B2C',
			micPreampGain: 42,
			headphoneVolume: -100,
			micLowCutHz: 80,
		})
		expect(result.warnings).toContain('Ignoring unsupported keys: identity')
	})

	it('round-trips SKM command colors and drops invalid entries', () => {
		const source = makeSkmDevice({ commandColors: { released: '#000000', pressed: '#00A100' } })
		expect(getPortableMobileDeviceSettings(source).commandColors).toEqual(source.commandColors)

		const result = parseMobileDeviceSettingsJson(
			JSON.stringify({ type: MtType.SKM, commandColors: { pressed: '#00a100', latched: 42 } }),
			makeSkmDevice(),
		)

		expect(result.payload).toEqual({ commandColors: { pressed: '#00A100' } })
		expect(result.warnings).toContain('Ignoring commandColors.latched: invalid color value.')
	})

	it('snaps imported SEK values to the device step sizes', () => {
		const result = parseMobileDeviceSettingsJson(
			JSON.stringify({
				type: MtType.SEK,
				headphoneVolume: -20.3,
				headphoneVolumeLimit: 3.2,
				headphoneBalance: 4.6,
				micPreampGain: 12.4,
				micTestToneLevel: -24.5,
			}),
			makeSekDevice(),
		)

		expect(result.payload).toEqual({
			headphoneVolume: -20.5,
			headphoneVolumeLimit: 3,
			headphoneBalance: 5,
			micPreampGain: 12,
			micTestToneLevel: -24,
		})
	})

	it('applies only shared settings when source and target types differ', () => {
		const result = parseMobileDeviceSettingsJson(
			JSON.stringify({ type: MtType.SEK, name: 'Shared', headphoneVolume: 10, micPreampGain: -20 }),
			makeSkmDevice(),
		)

		expect(result.payload).toEqual({ name: 'Shared', micPreampGain: -10 })
		expect(result.warnings).toContain('Source type SEK differs from target SKM; applying shared settings only.')
	})
})

describe('display utilities', () => {
	it.each([
		[undefined, 'Off'],
		[-1, 'Off'],
		[0, '0:00'],
		[125, '2:05'],
	])('formats battery runtime %j as %s', (minutes, expected) => {
		expect(formatBatteryRuntimeMinutes(minutes)).toBe(expected)
	})

	it.each([
		[RFChannels.Scan, 'Scan'],
		[RFChannels.Off, 'Off'],
		[RFChannels['RF Channel 1'], 474],
		[RFChannels['RF Channel 2'], '—'],
	])('resolves antenna binding %s', (binding, expected) => {
		const antenna: Antenna = {
			antennaPortId: AntennaPortId.A,
			state: DeviceStatus.Connected,
			type: 'DAD',
			identify: false,
			bindings: [{ subAntennaId: 0, binding, mismatch: false }],
		}
		const channels = new Map<number, RfChannel>([[0, { frequency: 474000 } as RfChannel]])
		expect(getAntennaFrequency(antenna, channels)).toBe(expected)
	})
})
