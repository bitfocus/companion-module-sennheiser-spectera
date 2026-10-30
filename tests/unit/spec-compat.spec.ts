import { describe, expect, it } from 'vitest'
import {
	AudiolinkModeId,
	BandwidthMode,
	CommandBehavior,
	CommandState,
	InputSource,
	InterfaceInputStatus,
	PsuStatus,
	RfState,
	RfStateStartup,
	TempStatus,
	TxPower,
} from '../../src/types.js'

function enumValues(value: Record<string, unknown>): unknown[] {
	return Object.keys(value)
		.filter((key) => Number.isNaN(Number(key)))
		.map((key) => value[key])
}

describe('v16 and v18 shared API contracts', () => {
	it('keeps RF enum values aligned with both specifications', () => {
		expect(enumValues(TxPower)).toEqual([10, 20, 30, 50, 100])
		expect(enumValues(BandwidthMode)).toEqual([6000, 8000, 10000])
		expect(enumValues(RfState)).toEqual(['RfActive', 'RfMuted'])
		expect(enumValues(RfStateStartup)).toEqual(['RfActive', 'RfMuted', 'RfLastState'])
	})

	it('includes every documented audio-link mode, including empty-link modes', () => {
		expect((enumValues(AudiolinkModeId) as number[]).sort((a, b) => a - b)).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 1001, 1002,
		])
	})

	it('models health and interface status values exactly as specified', () => {
		expect(enumValues(PsuStatus)).toEqual(['connected', 'unconnected', 'disconnected'])
		expect(enumValues(TempStatus)).toEqual(['normal', 'low', 'high', 'critical'])
		expect(enumValues(InterfaceInputStatus)).toEqual([
			'NoToggle',
			'TooFast',
			'Mismatch',
			'Unlocked',
			'Locked',
			'LoopThrough',
		])
	})
})

describe('v16 to v18 compatibility contracts', () => {
	it('uses canonical v18 input-source values', () => {
		expect(enumValues(InputSource)).toEqual(['AoIp', 'Madi1', 'Madi2'])
	})

	it('includes the v18 additions to command behavior and state', () => {
		expect(enumValues(CommandBehavior)).toEqual(['Disabled', 'Momentary', 'Latching'])
		expect(enumValues(CommandState)).toEqual(['Unknown', 'NotAvailable', 'Released', 'Pressed', 'Unlatched', 'Latched'])
	})
})
