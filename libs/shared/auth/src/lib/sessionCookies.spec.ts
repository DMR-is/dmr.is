import {
  appAuthCookies,
  isAppAuthCookie,
  sessionCookieName,
} from './sessionCookies'

// The point of the prefix is that two apps on one host stop sharing a session
// cookie. That only holds if every name NextAuth sets is renamed — and if an
// app that passes no prefix keeps exactly the names it has today.
describe('sessionCookies', () => {
  const env = process.env
  afterEach(() => {
    process.env = env
  })

  const setEnv = (vars: Record<string, string | undefined>) => {
    process.env = { ...env, ...vars }
  }

  describe('sessionCookieName', () => {
    it('keeps NextAuth’s default name when no prefix is given', () => {
      setEnv({ NODE_ENV: 'development' })
      expect(sessionCookieName()).toBe('next-auth.session-token')
    })

    it('renames under the prefix', () => {
      setEnv({ NODE_ENV: 'development' })
      expect(sessionCookieName('doe-web')).toBe('doe-web.session-token')
    })

    it('is __Secure- in production, as the refresh middleware always named it', () => {
      setEnv({ NODE_ENV: 'production', NEXTAUTH_COOKIE_SECURE: undefined })
      expect(sessionCookieName()).toBe('__Secure-next-auth.session-token')
      expect(sessionCookieName('doe-web')).toBe(
        '__Secure-doe-web.session-token',
      )
    })

    it('honours NEXTAUTH_COOKIE_SECURE=false for plain-http deployments', () => {
      setEnv({ NODE_ENV: 'production', NEXTAUTH_COOKIE_SECURE: 'false' })
      expect(sessionCookieName('doe-web')).toBe('doe-web.session-token')
    })
  })

  describe('appAuthCookies', () => {
    it('renames every cookie NextAuth sets, not only the session', () => {
      setEnv({ NODE_ENV: 'development' })
      const cookies = appAuthCookies('doe-web')

      expect(Object.keys(cookies).sort()).toEqual(
        [
          'callbackUrl',
          'csrfToken',
          'nonce',
          'pkceCodeVerifier',
          'sessionToken',
          'state',
        ].sort(),
      )
      for (const cookie of Object.values(cookies)) {
        expect(cookie?.name.startsWith('doe-web.')).toBe(true)
      }
    })

    it('marks every cookie Secure in production, with __Host- on CSRF', () => {
      setEnv({ NODE_ENV: 'production', NEXTAUTH_COOKIE_SECURE: undefined })
      const cookies = appAuthCookies('doe-web')

      expect(cookies.csrfToken?.name).toBe('__Host-doe-web.csrf-token')
      expect(cookies.sessionToken?.name).toBe('__Secure-doe-web.session-token')
      for (const cookie of Object.values(cookies)) {
        expect(cookie?.options.secure).toBe(true)
      }
    })
  })

  describe('isAppAuthCookie', () => {
    it('matches this app’s cookies under any NextAuth prefix', () => {
      expect(isAppAuthCookie('doe-web.session-token', 'doe-web')).toBe(true)
      expect(isAppAuthCookie('doe-web.session-token.0', 'doe-web')).toBe(true)
      expect(isAppAuthCookie('__Secure-doe-web.state', 'doe-web')).toBe(true)
      expect(isAppAuthCookie('__Host-doe-web.csrf-token', 'doe-web')).toBe(true)
    })

    it('leaves another app’s session alone', () => {
      expect(isAppAuthCookie('next-auth.session-token', 'doe-web')).toBe(false)
      expect(isAppAuthCookie('doe-partner-web.session-token', 'doe-web')).toBe(
        false,
      )
      // A longer prefix that merely starts the same way is not this app's.
      expect(isAppAuthCookie('doe-web-x.session-token', 'doe-web')).toBe(false)
    })
  })
})
