import { NextRequest } from 'next/server'
import type { JWT } from 'next-auth/jwt'
import { getToken } from 'next-auth/jwt'

import { endSessionHandler } from './logoutHandler'
import { appAuthCookies } from './sessionCookies'

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}))

const LOGOUT_URL = 'http://localhost:3000/api/auth/logout'

// A same-origin request unless `headers` says otherwise
const post = (
  cookies: Record<string, string> = {},
  url = LOGOUT_URL,
  headers: Record<string, string> = { 'sec-fetch-site': 'same-origin' },
) =>
  new NextRequest(url, {
    method: 'POST',
    headers: {
      ...headers,
      cookie: Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
    },
  })

// Parsed Set-Cookie headers keyed by cookie name
const setCookies = (response: Response) =>
  Object.fromEntries(
    response.headers.getSetCookie().map((header) => {
      const [pair, ...attrs] = header.split(/;\s*/)
      return [
        pair.split('=')[0],
        { pair, attrs: attrs.map((a) => a.toLowerCase()) },
      ]
    }),
  )

describe('endSessionHandler', () => {
  const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>
  const env = process.env as Record<string, string | undefined>
  const original = {
    domain: env.IDENTITY_SERVER_DOMAIN,
    nodeEnv: env.NODE_ENV,
    nextAuthUrl: env.NEXTAUTH_URL,
    secure: env.NEXTAUTH_COOKIE_SECURE,
  }

  beforeEach(() => {
    env.IDENTITY_SERVER_DOMAIN = 'ids.example.is'
    env.NODE_ENV = 'development'
    delete env.NEXTAUTH_COOKIE_SECURE
    delete env.NEXTAUTH_URL
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    for (const [key, value] of [
      ['IDENTITY_SERVER_DOMAIN', original.domain],
      ['NODE_ENV', original.nodeEnv],
      ['NEXTAUTH_URL', original.nextAuthUrl],
      ['NEXTAUTH_COOKIE_SECURE', original.secure],
    ] as const) {
      if (value === undefined) delete env[key]
      else env[key] = value
    }
  })

  it('redirects with 303 to the end-session URL carrying the hint and redirect URI', async () => {
    mockedGetToken.mockResolvedValue({ idToken: 'the-id-token' } as JWT)

    const response = await endSessionHandler(
      post(),
      'https://web.example.is/callback',
    )

    expect(response.status).toBe(303)
    const url = new URL(response.headers.get('location') as string)
    expect(url.origin + url.pathname).toBe(
      'https://ids.example.is/connect/endsession',
    )
    expect(url.searchParams.get('id_token_hint')).toBe('the-id-token')
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe(
      'https://web.example.is/callback',
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('puts no token in the body', async () => {
    mockedGetToken.mockResolvedValue({ idToken: 'the-id-token' } as JWT)

    const response = await endSessionHandler(post(), 'https://web.example.is')

    expect(await response.text()).not.toContain('the-id-token')
  })

  it('omits id_token_hint when the session has no idToken', async () => {
    mockedGetToken.mockResolvedValue({} as JWT)

    const response = await endSessionHandler(post(), 'https://web.example.is')
    const url = new URL(response.headers.get('location') as string)

    expect(url.searchParams.has('id_token_hint')).toBe(false)
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe(
      'https://web.example.is/',
    )
  })

  it('percent-encodes the redirect URI', async () => {
    mockedGetToken.mockResolvedValue({ idToken: 't' } as JWT)
    const redirectUri = 'https://example.com/path?a=1&b=2'

    const response = await endSessionHandler(post(), redirectUri)
    const location = response.headers.get('location') as string

    expect(location).not.toContain('&b=2')
    expect(new URL(location).searchParams.get('post_logout_redirect_uri')).toBe(
      redirectUri,
    )
  })

  it('never takes the id token from the request URL', async () => {
    mockedGetToken.mockResolvedValue({ idToken: 'from-session' } as JWT)

    const response = await endSessionHandler(
      post({}, `${LOGOUT_URL}?id_token=attacker`),
      'https://web.example.is',
    )
    const url = new URL(response.headers.get('location') as string)

    expect(url.searchParams.get('id_token_hint')).toBe('from-session')
  })

  it('reads the session from the prefixed cookie name', async () => {
    mockedGetToken.mockResolvedValue(null)
    const request = post()

    await endSessionHandler(request, 'https://web.example.is', 'doe-web')

    expect(mockedGetToken).toHaveBeenCalledWith({
      req: request,
      cookieName: 'doe-web.session-token',
    })
  })

  it('reads NextAuth’s default name when no prefix is given', async () => {
    mockedGetToken.mockResolvedValue(null)
    const request = post()

    await endSessionHandler(request, 'https://web.example.is')

    expect(mockedGetToken).toHaveBeenCalledWith({
      req: request,
      cookieName: 'next-auth.session-token',
    })
  })

  describe('cookies', () => {
    it('expires the NextAuth set and every session chunk with matching attributes', async () => {
      mockedGetToken.mockResolvedValue({ idToken: 't' } as JWT)

      const response = await endSessionHandler(
        post({
          'lg-web.session-token': 'a',
          'lg-web.session-token.0': 'b',
          'lg-web.session-token.1': 'c',
          'other-app.session-token': 'z',
        }),
        'https://web.example.is',
        'lg-web',
      )
      const cookies = setCookies(response)

      const names = [
        'lg-web.session-token.0',
        'lg-web.session-token.1',
        ...Object.values(appAuthCookies('lg-web')).map((c) => c.name),
      ]
      expect(names).toEqual(
        expect.arrayContaining([
          'lg-web.pkce.code_verifier',
          'lg-web.state',
          'lg-web.nonce',
        ]),
      )

      for (const name of names) {
        expect(cookies[name]).toBeDefined()
        expect(cookies[name].pair).toBe(`${name}=`)
        expect(cookies[name].attrs).toEqual(
          expect.arrayContaining([
            'path=/',
            'max-age=0',
            'httponly',
            'samesite=lax',
          ]),
        )
        expect(cookies[name].attrs).not.toContain('secure')
      }
      expect(cookies['other-app.session-token']).toBeUndefined()
    })

    it('uses the __Secure- / __Host- names and Secure in production', async () => {
      env.NODE_ENV = 'production'
      mockedGetToken.mockResolvedValue({ idToken: 't' } as JWT)

      const response = await endSessionHandler(
        post({
          '__Secure-lg-web.session-token': 'a',
          '__Secure-lg-web.session-token.0': 'b',
        }),
        'https://web.example.is',
        'lg-web',
      )
      const cookies = setCookies(response)

      const names = [
        '__Secure-lg-web.session-token.0',
        ...Object.values(appAuthCookies('lg-web')).map((c) => c.name),
      ]
      expect(names).toEqual(
        expect.arrayContaining([
          '__Host-lg-web.csrf-token',
          '__Secure-lg-web.pkce.code_verifier',
          '__Secure-lg-web.state',
          '__Secure-lg-web.nonce',
        ]),
      )

      for (const name of names) {
        expect(cookies[name]).toBeDefined()
        expect(cookies[name].attrs).toEqual(
          expect.arrayContaining(['secure', 'path=/', 'max-age=0']),
        )
      }
    })

    it('clears NextAuth’s default names when no prefix is given', async () => {
      mockedGetToken.mockResolvedValue({ idToken: 't' } as JWT)

      const response = await endSessionHandler(
        post({ 'next-auth.session-token.0': 'a' }),
        'https://web.example.is',
      )
      const cookies = setCookies(response)

      expect(Object.keys(cookies)).toEqual(
        expect.arrayContaining([
          'next-auth.session-token',
          'next-auth.session-token.0',
          'next-auth.csrf-token',
          'next-auth.callback-url',
        ]),
      )
    })

    it('clears both the plain and the secure variants of the default names', async () => {
      mockedGetToken.mockResolvedValue(null)

      const response = await endSessionHandler(post(), 'https://web.example.is')
      const cookies = setCookies(response)

      expect(cookies['next-auth.session-token'].attrs).not.toContain('secure')
      expect(cookies['__Secure-next-auth.session-token'].attrs).toEqual(
        expect.arrayContaining(['secure', 'max-age=0']),
      )
      expect(cookies['__Host-next-auth.csrf-token'].attrs).toContain('secure')
      expect(cookies['__Secure-next-auth.state']).toBeDefined()
    })
  })

  describe('without a session', () => {
    it('clears the cookies and redirects to the post-logout URI', async () => {
      mockedGetToken.mockResolvedValue(null)

      const response = await endSessionHandler(
        post({ 'lg-web.session-token.0': 'stale' }),
        'https://web.example.is/',
        'lg-web',
      )
      const cookies = setCookies(response)

      expect(response.status).toBe(303)
      expect(response.headers.get('location')).toBe('https://web.example.is/')
      expect(cookies['lg-web.session-token.0'].attrs).toContain('max-age=0')
      expect(cookies['lg-web.csrf-token']).toBeDefined()
    })
  })

  describe('post-logout URI', () => {
    it.each([undefined, '', '/'])(
      'falls back to the origin root for %p and still clears cookies',
      async (uri) => {
        mockedGetToken.mockResolvedValue(null)

        const response = await endSessionHandler(post(), uri, 'lg-web')

        expect(response.status).toBe(303)
        expect(response.headers.get('location')).toBe('http://localhost:3000/')
        expect(setCookies(response)['lg-web.session-token']).toBeDefined()
      },
    )

    it('resolves a relative URI against the origin', async () => {
      mockedGetToken.mockResolvedValue(null)

      const response = await endSessionHandler(post(), '/innskraning', 'lg-web')

      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/innskraning',
      )
    })

    it('resolves against the NEXTAUTH_URL origin when it is set', async () => {
      env.NEXTAUTH_URL = 'https://public.example.is/api/auth'
      mockedGetToken.mockResolvedValue(null)

      const response = await endSessionHandler(post(), '/innskraning')

      expect(response.headers.get('location')).toBe(
        'https://public.example.is/innskraning',
      )
    })
  })

  describe('origin check', () => {
    const refusals = async (request: NextRequest) => {
      mockedGetToken.mockResolvedValue({ idToken: 't' } as JWT)
      const response = await endSessionHandler(
        request,
        'https://web.example.is',
        'lg-web',
      )

      expect(response.status).toBe(403)
      expect(response.headers.getSetCookie()).toEqual([])
      expect(response.headers.get('location')).toBeNull()
      expect(await response.text()).toBe('')
      expect(mockedGetToken).not.toHaveBeenCalled()
    }

    it('allows Sec-Fetch-Site: same-origin', async () => {
      mockedGetToken.mockResolvedValue(null)
      const response = await endSessionHandler(
        post({}, LOGOUT_URL, { 'sec-fetch-site': 'same-origin' }),
        'https://web.example.is',
      )

      expect(response.status).toBe(303)
    })

    it.each(['cross-site', 'same-site', 'none'])(
      'refuses Sec-Fetch-Site: %s, even with a matching Origin',
      (site) =>
        refusals(
          post({ 'lg-web.session-token': 'a' }, LOGOUT_URL, {
            'sec-fetch-site': site,
            origin: 'http://localhost:3000',
          }),
        ),
    )

    it('allows a matching Origin when Sec-Fetch-Site is absent', async () => {
      mockedGetToken.mockResolvedValue(null)
      const response = await endSessionHandler(
        post({}, LOGOUT_URL, { origin: 'http://localhost:3000' }),
        'https://web.example.is',
      )

      expect(response.status).toBe(303)
    })

    it('allows the NEXTAUTH_URL origin when the request host is internal', async () => {
      env.NEXTAUTH_URL = 'https://public.example.is/api/auth'
      mockedGetToken.mockResolvedValue(null)
      const response = await endSessionHandler(
        post({}, LOGOUT_URL, { origin: 'https://public.example.is' }),
        'https://web.example.is',
      )

      expect(response.status).toBe(303)
    })

    it('refuses a mismatched Origin', () =>
      refusals(
        post({ 'lg-web.session-token': 'a' }, LOGOUT_URL, {
          origin: 'https://evil.example.com',
        }),
      ))

    it('refuses Origin: null', () =>
      refusals(post({}, LOGOUT_URL, { origin: 'null' })))

    it('refuses a request with neither header', () =>
      refusals(post({ 'lg-web.session-token': 'a' }, LOGOUT_URL, {})))
  })
})
