import { NextRequest, NextResponse } from 'next/server'

import {
  appAuthCookies,
  expireAppAuthCookies,
  expiredAuthCookieOptions,
  isAppAuthCookie,
  sessionCookieName,
  sessionCookieNames,
} from './sessionCookies'

// The point of the prefix is that two apps on one host stop sharing a session
// cookie. That only holds if every name NextAuth sets is renamed — and if an
// app that passes no prefix keeps exactly the names it has today.
describe('sessionCookies', () => {
  // Individual keys, set and restored, rather than swapping `process.env` for
  // a plain object — which would stop it coercing and drop Node's own
  // handling of the real environment.
  const KEYS = ['NODE_ENV', 'NEXTAUTH_COOKIE_SECURE'] as const
  const env = process.env as Record<string, string | undefined>
  const original = Object.fromEntries(KEYS.map((key) => [key, env[key]]))

  const setEnv = (vars: Partial<Record<(typeof KEYS)[number], string>>) => {
    for (const key of KEYS) {
      if (vars[key] === undefined) delete env[key]
      else env[key] = vars[key]
    }
  }

  afterEach(() => {
    for (const key of KEYS) {
      if (original[key] === undefined) delete env[key]
      else env[key] = original[key]
    }
  })

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
      setEnv({ NODE_ENV: 'production' })
      expect(sessionCookieName()).toBe('__Secure-next-auth.session-token')
      expect(sessionCookieName('doe-web')).toBe(
        '__Secure-doe-web.session-token',
      )
    })

    it('treats an empty prefix as none, as createAuthMiddleware does', () => {
      setEnv({ NODE_ENV: 'development' })
      expect(sessionCookieName('')).toBe('next-auth.session-token')
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
      setEnv({ NODE_ENV: 'production' })
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
      expect(isAppAuthCookie('oj-web.session-token', 'doe-web')).toBe(false)
      // A longer prefix that merely starts the same way is not this app's.
      expect(isAppAuthCookie('doe-web-x.session-token', 'doe-web')).toBe(false)
    })
  })

  describe('expiredAuthCookieOptions', () => {
    // A deletion without `Secure` is rejected for a `__Secure-` / `__Host-`
    // name, so in production the expiry must carry it.
    it('expires with Secure in production, on the path NextAuth uses', () => {
      setEnv({ NODE_ENV: 'production' })
      expect(expiredAuthCookieOptions()).toEqual(
        expect.objectContaining({ path: '/', maxAge: 0, secure: true }),
      )
    })

    it('expires without Secure on plain-http local dev', () => {
      setEnv({ NODE_ENV: 'development' })
      expect(expiredAuthCookieOptions().secure).toBe(false)
    })
  })

  describe('sessionCookieNames', () => {
    it('is the one prefixed name for an app with its own prefix', () => {
      setEnv({ NODE_ENV: 'development' })
      expect(sessionCookieNames('lg-web')).toEqual(['lg-web.session-token'])
    })

    it('is both variants of the default name otherwise, secure first', () => {
      setEnv({ NODE_ENV: 'development' })
      expect(sessionCookieNames()).toEqual([
        '__Secure-next-auth.session-token',
        'next-auth.session-token',
      ])
    })
  })

  describe('expireAppAuthCookies', () => {
    const expire = (cookies: Record<string, string>, prefix?: string) => {
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        headers: {
          cookie: Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join('; '),
        },
      })
      const response = NextResponse.next()
      expireAppAuthCookies(request, response, prefix)

      return Object.fromEntries(
        response.headers.getSetCookie().map((header) => {
          const [pair, ...attrs] = header.split(/;\s*/)
          return [
            pair.split('=')[0],
            { pair, attrs: attrs.map((a) => a.toLowerCase()) },
          ]
        }),
      )
    }

    it('expires the full set under the prefix, plain, in development', () => {
      setEnv({ NODE_ENV: 'development' })
      const cookies = expire({}, 'lg-web')

      expect(Object.keys(cookies).sort()).toEqual([
        'lg-web.callback-url',
        'lg-web.csrf-token',
        'lg-web.nonce',
        'lg-web.pkce.code_verifier',
        'lg-web.session-token',
        'lg-web.state',
      ])
      for (const cookie of Object.values(cookies)) {
        expect(cookie.attrs).toEqual(
          expect.arrayContaining([
            'path=/',
            'max-age=0',
            'httponly',
            'samesite=lax',
          ]),
        )
        expect(cookie.attrs).not.toContain('secure')
        expect(
          cookie.attrs.some((a) => a.startsWith('expires=thu, 01 jan 1970')),
        ).toBe(true)
        expect(cookie.pair).toMatch(/=$/)
      }
    })

    it('uses __Secure- / __Host- names, each with Secure, in production', () => {
      setEnv({ NODE_ENV: 'production' })
      const cookies = expire({}, 'lg-web')

      expect(Object.keys(cookies).sort()).toEqual([
        '__Host-lg-web.csrf-token',
        '__Secure-lg-web.callback-url',
        '__Secure-lg-web.nonce',
        '__Secure-lg-web.pkce.code_verifier',
        '__Secure-lg-web.session-token',
        '__Secure-lg-web.state',
      ])
      for (const cookie of Object.values(cookies)) {
        expect(cookie.attrs).toEqual(
          expect.arrayContaining(['secure', 'path=/', 'max-age=0']),
        )
      }
    })

    it('expires session chunks of this app only', () => {
      setEnv({ NODE_ENV: 'development' })
      const cookies = expire(
        {
          'lg-web.session-token.0': 'a',
          'lg-web.session-token.1': 'b',
          'other.session-token.0': 'z',
        },
        'lg-web',
      )

      expect(cookies['lg-web.session-token.0'].attrs).toContain('max-age=0')
      expect(cookies['lg-web.session-token.1'].attrs).toContain('max-age=0')
      expect(cookies['other.session-token.0']).toBeUndefined()
    })

    it.each(['development', 'production'])(
      'expires both variants of the default names in %s',
      (nodeEnv) => {
        setEnv({ NODE_ENV: nodeEnv })
        const cookies = expire({ 'next-auth.session-token.0': 'a' })

        expect(Object.keys(cookies).sort()).toEqual([
          '__Host-next-auth.csrf-token',
          '__Secure-next-auth.callback-url',
          '__Secure-next-auth.nonce',
          '__Secure-next-auth.pkce.code_verifier',
          '__Secure-next-auth.session-token',
          '__Secure-next-auth.state',
          'next-auth.callback-url',
          'next-auth.csrf-token',
          'next-auth.nonce',
          'next-auth.pkce.code_verifier',
          'next-auth.session-token',
          'next-auth.session-token.0',
          'next-auth.state',
        ])
        expect(cookies['next-auth.state'].attrs).not.toContain('secure')
        expect(cookies['__Secure-next-auth.state'].attrs).toContain('secure')
        expect(cookies['__Host-next-auth.csrf-token'].attrs).toContain('secure')
      },
    )
  })
})
