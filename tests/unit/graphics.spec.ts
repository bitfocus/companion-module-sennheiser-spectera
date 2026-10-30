import { ParseExpression, ResolveExpression } from '@companion-app/expressions'
import { describe, expect, it } from 'vitest'
import { dbToPercent, dbToPercentExpression } from '../../src/graphics.js'

function evaluateMeterExpression(level: unknown): unknown {
	return ResolveExpression(ParseExpression(dbToPercentExpression('$(options:level)')), {
		unknownVariableValue: undefined,
		parseVariables: null,
		getVariableValue: (id) => {
			expect(id).toBe('options:level')
			return level as any
		},
	})
}

describe('audio meter expression', () => {
	it('matches dbToPercent across the meter range and beyond', () => {
		for (let db = -130; db <= 6; db += 0.5) {
			expect(evaluateMeterExpression(db)).toBeCloseTo(dbToPercent(db), 10)
		}
	})

	it('draws an empty meter for a non-numeric level', () => {
		for (const level of [undefined, 'abc', NaN]) {
			expect(evaluateMeterExpression(level)).toBe(0)
		}
	})
})
