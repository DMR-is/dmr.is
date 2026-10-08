/** @jest-environment node */
import { FetchError, Response as NodeFetchResponse } from 'node-fetch'

import { getDmrClient } from '../api/createClient'
import { authorize } from './authOptions'

jest.mock('../api/createClient', () => ({ getDmrClient: jest.fn() }))
jest.mock('./logoutHint', () => ({ setLogoutHint: jest.fn() }))
// ESM-only and only used by signIn, not by authorize
jest.mock('jose', () => ({ decodeJwt: jest.fn() }))
jest.mock('@dmr.is/logging-next', () => ({
  getLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}))

const getUserByNationalId = jest.fn()

beforeEach(() => {
  jest.mocked(getDmrClient).mockReturnValue({
    getUserByNationalId,
  } as unknown as ReturnType<typeof getDmrClient>)
  getUserByNationalId.mockReset()
})

const editor = { id: 'u1', role: { slug: 'ritstjori' } }

// The API client throws node-fetch's Response on a non-2xx status
const httpError = (status: number) =>
  new NodeFetchResponse('', { status }) as unknown as Error

describe('authorize', () => {
  it('returns the member for an editor', async () => {
    getUserByNationalId.mockResolvedValue({ user: editor })

    await expect(authorize('0101302399', 'id-token')).resolves.toBe(editor)
  })

  it('refuses a member who is not an editor', async () => {
    getUserByNationalId.mockResolvedValue({
      user: { id: 'u2', role: { slug: 'fulltrui' } },
    })

    await expect(authorize('0101307789', 'id-token')).resolves.toBeNull()
  })

  it('refuses when no member is returned', async () => {
    getUserByNationalId.mockResolvedValue({ user: null })

    await expect(authorize('0101302989', 'id-token')).resolves.toBeNull()
  })

  it.each([401, 403, 404])('refuses on a %i from the API', async (status) => {
    getUserByNationalId.mockRejectedValue(httpError(status))

    await expect(authorize('0101302989', 'id-token')).resolves.toBeNull()
  })

  it.each([
    ['a 500 from the API', httpError(500)],
    ['a 502 from the API', httpError(502)],
    ['a network failure', new FetchError('connect ECONNREFUSED', 'system')],
    ['a client error', new TypeError('fetch failed')],
  ])('throws SignInFailed on %s', async (_label, error) => {
    getUserByNationalId.mockRejectedValue(error)

    await expect(authorize('0101302399', 'id-token')).rejects.toThrow(
      'SignInFailed',
    )
  })

  it('throws SignInFailed when the token has no national id', async () => {
    await expect(authorize(undefined, 'id-token')).rejects.toThrow(
      'SignInFailed',
    )
    expect(getUserByNationalId).not.toHaveBeenCalled()
  })
})
