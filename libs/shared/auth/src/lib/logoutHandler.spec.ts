import { NextRequest } from 'next/server'
import type { JWT } from 'next-auth/jwt'
import { getToken } from 'next-auth/jwt'

import { endSessionHandler } from './logoutHandler'

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}))

describe('endSessionHandler', () => {
  const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>
  const originalDomain = process.env.IDENTITY_SERVER_DOMAIN

  beforeEach(() => {
    process.env.IDENTITY_SERVER_DOMAIN = 'ids.example.is'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env.IDENTITY_SERVER_DOMAIN = originalDomain
  })

  it('returns 401 with "No token found" when there is no session', async () => {
    mockedGetToken.mockResolvedValue(null)
    const request = new NextRequest('http://localhost:3000/api/auth/logout')

    const response = await endSessionHandler(request, 'https://web.example.is')

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: 'No token found' })
  })

  it('builds the end-session URL from the token in the session, not the request', async () => {
    mockedGetToken.mockResolvedValue({ idToken: 'the-id-token' } as JWT)
    const request = new NextRequest('http://localhost:3000/api/auth/logout')

    const response = await endSessionHandler(
      request,
      'https://web.example.is/callback',
    )
    const { url: sessionUrl } = await response.json()
    const url = new URL(sessionUrl)

    expect(url.origin + url.pathname).toBe(
      'https://ids.example.is/connect/endsession',
    )
    expect(url.searchParams.get('id_token_hint')).toBe('the-id-token')
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe(
      'https://web.example.is/callback',
    )
  })

  it('omits id_token_hint entirely when the session has no idToken', async () => {
    mockedGetToken.mockResolvedValue({} as JWT)
    const request = new NextRequest('http://localhost:3000/api/auth/logout')

    const response = await endSessionHandler(request, 'https://web.example.is')
    const { url: sessionUrl } = await response.json()
    const url = new URL(sessionUrl)

    expect(url.searchParams.has('id_token_hint')).toBe(false)
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe(
      'https://web.example.is',
    )
  })

  // Regression test: the old code concatenated postLogoutRedirectUri into the
  // query string as a raw string. A redirect URI with its own query params
  // would then leak a second, unencoded top-level parameter.
  it('percent-encodes the redirect URI instead of concatenating it raw', async () => {
    mockedGetToken.mockResolvedValue({ idToken: 'the-id-token' } as JWT)
    const request = new NextRequest('http://localhost:3000/api/auth/logout')
    const redirectUri = 'https://example.com/path?a=1&b=2'

    const response = await endSessionHandler(request, redirectUri)
    const { url: sessionUrl } = await response.json()

    // If b=2 had leaked in unencoded, it would show up as its own "&b=2"
    // segment rather than being escaped inside the redirect URI's value.
    expect(sessionUrl).not.toContain('&b=2')

    const url = new URL(sessionUrl)
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe(redirectUri)
  })

  // The security fix this file exists to verify: id_token must come from the
  // HttpOnly session cookie (via getToken), never from the request URL.
  it('never takes id_token from the request URL', async () => {
    mockedGetToken.mockResolvedValue({ idToken: 'token-from-session' } as JWT)
    const request = new NextRequest(
      'http://localhost:3000/api/auth/logout?id_token=attacker-supplied',
    )

    const response = await endSessionHandler(request, 'https://web.example.is')
    const { url: sessionUrl } = await response.json()
    const url = new URL(sessionUrl)

    expect(url.searchParams.get('id_token_hint')).toBe('token-from-session')
  })
})
