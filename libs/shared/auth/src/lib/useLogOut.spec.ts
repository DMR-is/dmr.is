import { signIn, signOut } from 'next-auth/react'

import { forceLogin, useLogOut } from './useLogOut'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(() => Promise.resolve()),
}))

jest.mock('./identityProvider', () => ({
  identityServerId: 'ids',
  signOutUrl: () => '/api/auth/logout',
}))

describe('useLogOut', () => {
  const calls: string[] = []
  const assign = jest.fn((url: string) => calls.push(`assign:${url}`))
  const clear = jest.fn(() => calls.push('sessionStorage.clear'))
  const fetchMock = jest.fn()

  beforeEach(() => {
    calls.length = 0
    jest.clearAllMocks()
    Object.assign(globalThis, {
      window: { location: { assign, origin: 'https://app.example.is' } },
      sessionStorage: { clear },
      fetch: fetchMock,
    })
    jest.mocked(signOut).mockImplementation(async () => {
      calls.push('signOut')
      return undefined as never
    })
  })

  it('clears storage, revokes, ends the session, signs out, then redirects', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      calls.push(`fetch:${url}`)
      return url === '/api/auth/logout'
        ? {
            ok: true,
            json: async () => ({ url: 'https://ids.example.is/end' }),
          }
        : { ok: true }
    })

    await useLogOut()()

    expect(calls).toEqual([
      'sessionStorage.clear',
      'fetch:/api/auth/revoke-refresh',
      'fetch:/api/auth/logout',
      'signOut',
      'assign:https://ids.example.is/end',
    ])
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/revoke-refresh', {
      method: 'POST',
    })
  })

  it('still signs out and falls back to the app origin when both requests fail', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    await useLogOut()()

    expect(signOut).toHaveBeenCalledWith({ redirect: false })
    expect(assign).toHaveBeenCalledWith('https://app.example.is')
  })

  it('does not stop when sessionStorage throws', async () => {
    clear.mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    fetchMock.mockResolvedValue({ ok: false })

    await useLogOut()()

    expect(signOut).toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith('https://app.example.is')
  })
})

describe('forceLogin', () => {
  it('signs in again even when sessionStorage throws', () => {
    Object.assign(globalThis, {
      window: {},
      sessionStorage: {
        clear: () => {
          throw new DOMException('blocked', 'SecurityError')
        },
      },
    })

    forceLogin('/ritstjorn')

    expect(signIn).toHaveBeenCalledWith('ids', { callbackUrl: '/ritstjorn' })
  })
})
