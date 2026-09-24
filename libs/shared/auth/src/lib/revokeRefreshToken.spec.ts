import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { revokeRefreshTokenHandler } from './revokeRefreshToken'

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}))
jest.mock('@dmr.is/logging-next', () => ({
  getLogger: () => ({ info: jest.fn(), error: jest.fn() }),
}))

// The handler must read the session from the app's own cookie: an app on a
// prefix that fell back to NextAuth's default name would revoke nothing — or
// another app's refresh token.
describe('revokeRefreshTokenHandler', () => {
  const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>
  const config = { clientId: 'client', clientSecret: 'secret' }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('reads the session from the cookie name it is given', async () => {
    mockedGetToken.mockResolvedValue(null)
    const request = new NextRequest('http://localhost:3000/api/auth/revoke')

    const response = await revokeRefreshTokenHandler(
      request,
      config,
      'doe-web.session-token',
    )

    expect(mockedGetToken).toHaveBeenCalledWith({
      req: request,
      cookieName: 'doe-web.session-token',
    })
    expect(response.status).toBe(401)
  })

  it('leaves the name to NextAuth when none is given', async () => {
    mockedGetToken.mockResolvedValue(null)
    const request = new NextRequest('http://localhost:3000/api/auth/revoke')

    await revokeRefreshTokenHandler(request, config)

    expect(mockedGetToken).toHaveBeenCalledWith({
      req: request,
      cookieName: undefined,
    })
  })
})
