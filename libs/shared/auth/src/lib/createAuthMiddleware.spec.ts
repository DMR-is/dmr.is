import { withAuth } from 'next-auth/middleware'

import { createAuthMiddleware } from './middleware-helpers'

jest.mock('next-auth/middleware', () => ({
  withAuth: jest.fn(() => 'middleware'),
}))
jest.mock('next-auth/jwt', () => ({
  encode: jest.fn(),
}))
jest.mock('@dmr.is/logging-next', () => ({
  getLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}))

// Both directions matter. Without `cookies` for a prefixed app, withAuth reads
// NextAuth's default name, sees no session and loops the user through sign-in.
// With `cookies` for an app that did not opt in, withAuth's name would change
// from the one it derives from NEXTAUTH_URL — renaming the session cookie in
// every other web.
describe('createAuthMiddleware', () => {
  const mockedWithAuth = withAuth as unknown as jest.Mock
  const base = {
    clientId: 'client',
    clientSecret: 'secret',
    redirectUriEnvVar: 'BASE_URL',
    fallbackRedirectUri: 'http://localhost',
    signInPath: '/innskraning',
  }

  const optionsPassed = () => mockedWithAuth.mock.calls[0][1]

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('tells withAuth the session cookie of an app on its own prefix', () => {
    createAuthMiddleware({ ...base, cookiePrefix: 'doe-partner-web' })

    expect(optionsPassed().cookies).toEqual({
      sessionToken: { name: 'doe-partner-web.session-token' },
    })
  })

  it('passes no cookie options for an app that has not opted in', () => {
    createAuthMiddleware(base)

    expect(optionsPassed()).not.toHaveProperty('cookies')
  })

  it('treats an empty prefix as none', () => {
    createAuthMiddleware({ ...base, cookiePrefix: '' })

    expect(optionsPassed()).not.toHaveProperty('cookies')
  })
})
