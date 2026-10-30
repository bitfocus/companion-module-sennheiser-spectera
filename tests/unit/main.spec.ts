import { afterEach, describe, expect, it, vi } from 'vitest'
import { SpecteraInstance } from '../../src/main.js'

interface ConfirmationHarness {
	pendingConfirmations: Map<string, NodeJS.Timeout>
	checkFeedbacks: ReturnType<typeof vi.fn>
}

describe('action confirmation', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('builds stable keys independent of option insertion order', () => {
		const key = SpecteraInstance.prototype.confirmationKey.call({} as SpecteraInstance, 'route', {
			state: 'On',
			channel: 2,
		})
		expect(key).toBe('route:channel=2,state=On')
	})

	it('requires a second press and consumes the pending confirmation', () => {
		vi.useFakeTimers()
		const harness: ConfirmationHarness = { pendingConfirmations: new Map(), checkFeedbacks: vi.fn() }

		expect(SpecteraInstance.prototype.confirmAction.call(harness as any, 'action:key')).toBe(false)
		expect(harness.pendingConfirmations.has('action:key')).toBe(true)
		expect(SpecteraInstance.prototype.confirmAction.call(harness as any, 'action:key')).toBe(true)
		expect(harness.pendingConfirmations.has('action:key')).toBe(false)
		expect(harness.checkFeedbacks).toHaveBeenCalledTimes(2)
	})

	it('expires an unconfirmed action and refreshes its feedback', () => {
		vi.useFakeTimers()
		const harness: ConfirmationHarness = { pendingConfirmations: new Map(), checkFeedbacks: vi.fn() }

		SpecteraInstance.prototype.confirmAction.call(harness as any, 'action:key', 250)
		vi.advanceTimersByTime(250)
		expect(harness.pendingConfirmations.size).toBe(0)
		expect(harness.checkFeedbacks).toHaveBeenLastCalledWith('confirmPending')
	})
})
