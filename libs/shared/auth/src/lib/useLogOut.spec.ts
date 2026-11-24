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
  const clear = jest.fn(() => calls.push('sessionStorage.clear'))
  const fetchMock = jest.fn()
  const form: Record<string, unknown> = {}

  beforeEach(() => {
    calls.length = 0
    jest.clearAllMocks()
    for (const key of Object.keys(form)) delete form[key]
    form.submit = jest.fn(() => calls.push('form.submit'))
    Object.assign(globalThis, {
      window: { location: { origin: 'https://app.example.is' } },
      document: {
        createElement: jest.fn(() => form),
        body: { appendChild: jest.fn(() => calls.push('form.append')) },
      },
      sessionStorage: { clear },
      fetch: fetchMock,
    })
  })

  it('clears storage, revokes, then submits a top-level POST form', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      calls.push(`fetch:${url}`)
      return { ok: true }
    })

    await useLogOut()()

    expect(calls).toEqual([
      'sessionStorage.clear',
      'fetch:/api/auth/revoke-refresh',
      'form.append',
      'form.submit',
    ])
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/revoke-refresh', {
      method: 'POST',
    })
    expect(form.method).toBe('POST')
    expect(form.action).toBe('/api/auth/logout')
  })

  it('does not call next-auth signOut, which would delete the cookie first', async () => {
    fetchMock.mockResolvedValue({ ok: true })

    await useLogOut()()

    expect(signOut).not.toHaveBeenCalled()
  })

  it('still submits the form when revocation fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    await useLogOut()()

    expect(form.submit).toHaveBeenCalled()
  })

  it('does not stop when sessionStorage throws', async () => {
    clear.mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    fetchMock.mockResolvedValue({ ok: false })

    await useLogOut()()

    expect(form.submit).toHaveBeenCalled()
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
