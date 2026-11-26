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

  it('clears storage, then submits a top-level POST form without calling fetch', async () => {
    await useLogOut()()

    expect(calls).toEqual([
      'sessionStorage.clear',
      'form.append',
      'form.submit',
    ])
    // revocation happens in the logout route, after its origin check
    expect(fetchMock).not.toHaveBeenCalled()
    expect(form.method).toBe('POST')
    expect(form.action).toBe('/api/auth/logout')
  })

  it('does not call next-auth signOut, which would delete the cookie first', async () => {
    await useLogOut()()

    expect(signOut).not.toHaveBeenCalled()
  })

  it('does not stop when sessionStorage throws', async () => {
    clear.mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
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
