/** @jest-environment node */
import { FetchError, Response as NodeFetchResponse } from 'node-fetch'

import { getLegalGazetteClient } from '../api/createClient'
import { authorize } from './authOptions'

const mockLogError = jest.fn()

jest.mock('../api/createClient', () => ({ getLegalGazetteClient: jest.fn() }))
jest.mock('./logoutHint', () => ({ setLogoutHint: jest.fn() }))
// ESM-only and only used by signIn, not by authorize
jest.mock('jose', () => ({ decodeJwt: jest.fn() }))
jest.mock('@dmr.is/logging-next', () => ({
  getLogger: () => ({
    error: (...args: unknown[]) => mockLogError(...args),
    info: jest.fn(),
    warn: jest.fn(),
  }),
}))

const getMyUser = jest.fn()

beforeEach(() => {
  jest.mocked(getLegalGazetteClient).mockReturnValue({
    getMyUser,
  } as unknown as ReturnType<typeof getLegalGazetteClient>)
  getMyUser.mockReset()
  mockLogError.mockReset()
})

// The API client throws node-fetch's Response, and serverFetcher reads its
// JSON body as the error
const httpError = (statusCode: number) =>
  new NodeFetchResponse(JSON.stringify({ statusCode, message: 'nope' }), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  })

describe('authorize', () => {
  it('returns the member', async () => {
    const member = { id: 'u1', name: 'Gervimaður Færeyjar' }
    getMyUser.mockResolvedValue(member)

    await expect(authorize('0101302399', 'id-token')).resolves.toBe(member)
  })

  it.each([403, 404])('refuses on a %i from the API', async (status) => {
    getMyUser.mockRejectedValue(httpError(status))

    await expect(authorize('0101307789', 'id-token')).resolves.toBeNull()
  })

  it.each([401, 500, 502])('throws SignInFailed on a %i', async (status) => {
    getMyUser.mockRejectedValue(httpError(status))

    await expect(authorize('0101302399', 'id-token')).rejects.toThrow(
      'SignInFailed',
    )
  })

  it.each([
    ['a network failure', new FetchError('connect ECONNREFUSED', 'system')],
    ['a client error', new TypeError('fetch failed')],
  ])('throws SignInFailed and logs on %s', async (_label, error) => {
    getMyUser.mockRejectedValue(error)

    await expect(authorize('0101302399', 'id-token')).rejects.toThrow(
      'SignInFailed',
    )
    expect(mockLogError).toHaveBeenCalledWith(
      'Failure authenticating',
      expect.objectContaining({ category: 'next-auth' }),
    )
  })

  it('throws SignInFailed when the token has no national id', async () => {
    await expect(authorize(undefined, 'id-token')).rejects.toThrow(
      'SignInFailed',
    )
    expect(getMyUser).not.toHaveBeenCalled()
  })
})
