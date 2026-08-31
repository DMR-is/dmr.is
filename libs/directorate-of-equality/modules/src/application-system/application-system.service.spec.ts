import { InternalServerErrorException } from '@nestjs/common'

import { ApplicationSystemService } from './application-system.service'

const XROAD_PATH = 'https://securityserver.internal/r1/IS-DEV/GOV/10000/dmr'

describe('ApplicationSystemService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const APPLICATION_ID = '3f8a1c2e-5b7d-4e91-a0c6-8d2f4b6e9a13'

  let service: ApplicationSystemService
  let fetchMock: jest.Mock

  // First call in any authenticated flow is the IDS token grab; the caller's
  // own request is the second.
  const tokenResponse = () => ({
    ok: true,
    status: 200,
    json: async () => ({
      access_token: 'test-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'test-scope',
    }),
  })

  const requestUrls = () =>
    fetchMock.mock.calls.map(([url]) => String(url)).slice(1)

  beforeEach(() => {
    jest.clearAllMocks()

    process.env.XROAD_ISLAND_IS_PATH = XROAD_PATH
    process.env.XROAD_DMR_CLIENT = 'IS-DEV/GOV/10000/dmr-client'
    process.env.ISLAND_IS_TOKEN_URL = 'https://ids.test/connect/token'
    process.env.ISLAND_IS_DMR_CLIENT_ID = 'client-id'
    process.env.ISLAND_IS_DMR_CLIENT_SECRET = 'client-secret'
    process.env.ISLAND_IS_DMR_CLIENT_SCOPES = 'scope'

    fetchMock = jest.fn()
    fetchMock.mockResolvedValueOnce(tokenResponse())
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    global.fetch = (fetchMock as unknown) as typeof fetch

    service = new ApplicationSystemService(logger as never)
  })

  it('submits the event to the application id under the configured X-Road path', async () => {
    await service.notifyApproved(APPLICATION_ID)

    expect(requestUrls()).toEqual([
      `${XROAD_PATH}/application-callback-v2/applications/${APPLICATION_ID}/submit`,
    ])
  })

  it.each([
    ['dot segments', '../../../../IS-DEV/GOV/1234567890/other/service'],
    ['a leading segment then dot segments', 'a/../../../r1/IS-DEV/GOV/10000/x'],
    ['a bare dot-dot', '..'],
    ['an absolute URL', 'https://attacker.example/collect'],
    ['a query string', `${APPLICATION_ID}?event=APPROVE`],
    ['an empty string', ''],
    ['a non-UUID handle', 'application-1'],
  ])(
    'refuses to build a callback URL from %s and never issues a request',
    async (_label, providerId) => {
      await expect(service.notifyApproved(providerId)).rejects.toThrow(
        InternalServerErrorException,
      )

      expect(fetchMock).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalled()
    },
  )

  it('keeps the X-Road prefix when it is configured with a trailing slash', async () => {
    process.env.XROAD_ISLAND_IS_PATH = `${XROAD_PATH}/`

    await service.notifyDenied(APPLICATION_ID)

    expect(requestUrls()).toEqual([
      `${XROAD_PATH}/application-callback-v2/applications/${APPLICATION_ID}/submit`,
    ])
  })

  it('sends the service credentials on the outbound call', async () => {
    await service.notifyEdited(APPLICATION_ID)

    const [, options] = fetchMock.mock.calls[1]
    expect(options.method).toBe('PUT')
    expect(options.headers).toMatchObject({
      Authorization: 'Bearer test-token',
      'X-Road-Client': 'IS-DEV/GOV/10000/dmr-client',
    })
  })
})
