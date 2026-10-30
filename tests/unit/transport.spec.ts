import { InstanceStatus } from '@companion-module/base'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { connectFailureStatus, HttpError } from '../../src/api.js'
import { makeApi } from '../helpers/mock-api.js'

describe('HTTP transport', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('sends authenticated JSON requests to the expected device URL', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ state: 'Normal' }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			}),
		)
		vi.stubGlobal('fetch', fetchMock)
		const { api } = makeApi()

		await expect(api.sendRequest('PUT', '/device/state', { state: 'Normal' })).resolves.toEqual({
			state: 'Normal',
		})
		const [url, options] = fetchMock.mock.calls[0]
		expect(url).toBe('https://192.0.2.1:443/api/device/state')
		expect(options).toMatchObject({ method: 'PUT', body: JSON.stringify({ state: 'Normal' }) })
		expect(options.headers).toMatchObject({
			Authorization: `Basic ${Buffer.from('controlSennheiser:password').toString('base64')}`,
			Accept: 'application/json',
			'Content-Type': 'application/json',
		})
	})

	it.each([
		['a 204 response', new Response(null, { status: 204 })],
		['an explicitly empty response', new Response(null, { status: 200, headers: { 'content-length': '0' } })],
		['malformed JSON', new Response('not-json', { status: 200 })],
	])('returns an empty object for %s', async (_label, response) => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
		const { api } = makeApi()

		await expect(api.sendRequest('GET', '/empty')).resolves.toEqual({})
	})

	it('reports the device response body when an HTTP request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('denied', { status: 401 })))
		const { api, instance } = makeApi()

		await expect(api.sendRequest('GET', '/protected')).rejects.toThrow('HTTP 401: denied')
		expect(instance.log).toHaveBeenCalledWith('error', 'API Request failed for GET /protected: HTTP 401: denied')
		expect(instance.log).toHaveBeenCalledWith('debug', 'API Request failed for GET /protected: HTTP 401: denied')
	})

	it('throws an HttpError carrying the status code', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('denied', { status: 401 })))
		const { api } = makeApi()

		await expect(api.sendRequest('GET', '/protected')).rejects.toMatchObject({ status: 401 })
	})
})

describe('connection failure status', () => {
	it.each([
		[new HttpError(401, ''), InstanceStatus.AuthenticationFailure],
		[new HttpError(403, ''), InstanceStatus.AuthenticationFailure],
		[new HttpError(500, ''), InstanceStatus.ConnectionFailure],
		[new TypeError('fetch failed'), InstanceStatus.ConnectionFailure],
		[new Error('The operation was aborted due to timeout'), InstanceStatus.ConnectionFailure],
	])('maps %s to %s', (err, status) => {
		expect(connectFailureStatus(err)).toBe(status)
	})

	it.each([
		[new HttpError(401, ''), InstanceStatus.AuthenticationFailure],
		[new TypeError('fetch failed'), InstanceStatus.ConnectionFailure],
	])('keeps the matching status when a reconnect fails with %s', async (err, status) => {
		const { api, instance } = makeApi()
		const internals = api as unknown as { performLogin(): Promise<void>; runReconnect(): Promise<void> }
		vi.spyOn(internals, 'performLogin').mockRejectedValue(err)
		vi.spyOn(api, 'scheduleReconnect').mockImplementation(() => undefined)

		await internals.runReconnect()

		expect(instance.updateStatus).toHaveBeenCalledWith(status)
	})
})
