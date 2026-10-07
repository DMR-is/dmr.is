/** @jest-environment node */
import { NextRequest } from 'next/server'

import { GET } from './route'

jest.mock('../../../../lib/auth/authOptions', () => ({
  AUTH_COOKIE_PREFIX: 'oj-web',
}))

const setCookies = (response: Response) =>
  response.headers.getSetCookie().map((cookie) => cookie.split(';')[0])

describe('GET /api/auth/access-denied', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env.IDENTITY_SERVER_DOMAIN = 'ids.example.is'
    process.env.OFFICIAL_JOURNAL_WEB_URL = 'https://oj.example.is'
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('sends a request without a logout hint straight to the login page', async () => {
    const request = new NextRequest(
      'http://localhost:4200/api/auth/access-denied',
    )

    const response = GET(request)

    expect(response.headers.get('location')).toBe(
      'http://localhost:4200/innskraning',
    )
    expect(setCookies(response)).toEqual([])
  })

  it('ends the identity server session for a refused sign-in', async () => {
    const request = new NextRequest(
      'http://localhost:4200/api/auth/access-denied',
      { headers: { cookie: 'oj.logout_hint=the-id-token' } },
    )

    const response = GET(request)
    const location = new URL(response.headers.get('location') as string)

    expect(location.origin).toBe('https://ids.example.is')
    expect(location.pathname).toBe('/connect/endsession')
    expect(location.searchParams.get('id_token_hint')).toBe('the-id-token')
    expect(location.searchParams.get('post_logout_redirect_uri')).toBe(
      'https://oj.example.is',
    )
  })

  it("expires the hint and this app's auth cookies, sets the error cookie, and leaves other apps alone", async () => {
    const request = new NextRequest(
      'http://localhost:4200/api/auth/access-denied',
      {
        headers: {
          cookie: [
            'oj.logout_hint=the-id-token',
            'oj-web.session-token=mine',
            'oj-web.csrf-token=mine',
            'doe-web.session-token=theirs',
          ].join('; '),
        },
      },
    )

    const cookies = setCookies(GET(request))

    expect(cookies).toEqual(
      expect.arrayContaining([
        'oj.logout_hint=',
        'oj-web.session-token=',
        'oj-web.csrf-token=',
        'oj.signin_error=AccessDenied',
      ]),
    )
    expect(cookies.some((cookie) => cookie.startsWith('doe-web.'))).toBe(false)
  })
})
