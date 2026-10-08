/** @jest-environment node */
import { FetchError, Response as NodeFetchResponse } from 'node-fetch'

import { serverFetcher } from './fetchers'

describe('serverFetcher', () => {
  it('returns the data on success', async () => {
    await expect(serverFetcher(async () => ({ id: 1 }))).resolves.toEqual({
      data: { id: 1 },
      error: null,
    })
  })

  it('returns the JSON error body of an HTTP error', async () => {
    const response = new NodeFetchResponse(
      JSON.stringify({ statusCode: 403, message: 'Forbidden' }),
      { status: 403 },
    )

    await expect(
      serverFetcher(async () => {
        throw response
      }),
    ).resolves.toEqual({
      data: null,
      error: { statusCode: 403, message: 'Forbidden' },
    })
  })

  it('rethrows a network failure unchanged', async () => {
    const error = new FetchError('connect ECONNREFUSED', 'system')

    await expect(
      serverFetcher(async () => {
        throw error
      }),
    ).rejects.toBe(error)
  })

  it('names the status when an HTTP error has a non-JSON body', async () => {
    const response = new NodeFetchResponse('<html>Bad Gateway</html>', {
      status: 502,
    })

    await expect(
      serverFetcher(async () => {
        throw response
      }),
    ).rejects.toThrow('HTTP 502 with a non-JSON body')
  })
})
