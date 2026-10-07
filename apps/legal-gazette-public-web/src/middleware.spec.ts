/** @jest-environment node */
import { AsyncLocalStorage } from 'async_hooks'

import { config } from './middleware'

jest.mock('@dmr.is/auth/middleware-helpers', () => ({
  createAuthMiddleware: jest.fn(() => jest.fn()),
}))
jest.mock('./lib/authOptions', () => ({
  AUTH_COOKIE_PREFIX: 'test',
  identityServerConfig: { clientId: 'id', clientSecret: 'secret' },
}))

describe('middleware matcher', () => {
  let doesMatch: (url: string) => boolean

  beforeAll(async () => {
    // Next's testing util expects the runtime's AsyncLocalStorage global
    Object.assign(globalThis, { AsyncLocalStorage })
    const { unstable_doesMiddlewareMatch: doesMiddlewareMatch } = await import(
      'next/experimental/testing/server'
    )
    doesMatch = (path) =>
      doesMiddlewareMatch({ config, url: `http://localhost${path}` })
  })

  it.each([
    '/skraning',
    '/sidur/um',
    '/error',
    '/error?error=SignInFailed',
    '/api/auth/session',
  ])('skips auth for %s', (path) => {
    expect(doesMatch(path)).toBe(false)
  })

  it.each(['/', '/errors', '/errorpage', '/api/trpc/getPublications'])(
    'guards %s',
    (path) => {
      expect(doesMatch(path)).toBe(true)
    },
  )
})
