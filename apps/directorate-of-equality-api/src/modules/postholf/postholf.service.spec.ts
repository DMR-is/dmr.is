import {
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common'

import { CompanyReminderTierEnum } from '../company/models/company-event.model'
import { ReportTypeEnum } from '../report/models/report.enums'
import { PostholfService } from './postholf.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const BASE = 'https://postholf.test'
const TOKEN_URL = 'https://login.microsoftonline.test/token'

const ENV = {
  POSTHOLF_BASE_PATH: BASE,
  POSTHOLF_TOKEN_URL: TOKEN_URL,
  POSTHOLF_CLIENT_ID: 'client-id',
  POSTHOLF_CLIENT_SECRET: 'client-secret',
  POSTHOLF_SENDER_NATIONAL_ID: '5501234567',
  POSTHOLF_SENDER_NAME: 'Jafnréttisstofa',
}

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response

const tokenResponse = (expiresIn = 3600) =>
  jsonResponse({
    access_token: 'token',
    token_type: 'Bearer',
    expires_in: expiresIn,
  })

const registerInput = {
  nationalId: '5509876543',
  documentId: 'DOE-EQOV-20260501-3f9a1c7b2d',
  reportType: ReportTypeEnum.EQUALITY,
  tier: CompanyReminderTierEnum.OVERDUE_NOTICE,
  dueDate: new Date('2026-05-01T00:00:00.000Z'),
  documentDate: new Date('2026-06-15T12:00:00.000Z'),
}

describe('PostholfService', () => {
  let service: PostholfService
  let fetchMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    Object.assign(process.env, ENV)
    delete process.env.POSTHOLF_SCOPE
    delete process.env.POSTHOLF_ENABLED

    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    service = new PostholfService(mockLogger as never)
  })

  afterEach(() => {
    for (const key of Object.keys(ENV)) delete process.env[key]
  })

  describe('isEnabled', () => {
    it('is off unless explicitly set to "true"', () => {
      expect(PostholfService.isEnabled()).toBe(false)

      process.env.POSTHOLF_ENABLED = 'false'
      expect(PostholfService.isEnabled()).toBe(false)

      // Anything other than the exact string is off — a legal-notice sender
      // should not be armed by a typo like "1" or "yes".
      process.env.POSTHOLF_ENABLED = '1'
      expect(PostholfService.isEnabled()).toBe(false)

      process.env.POSTHOLF_ENABLED = 'true'
      expect(PostholfService.isEnabled()).toBe(true)
    })
  })

  describe('token handling', () => {
    it('requests a client_credentials token with the default .default scope', async () => {
      fetchMock
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValueOnce(jsonResponse([{ success: true }]))

      await service.registerNotice(registerInput)

      const [url, options] = fetchMock.mock.calls[0]
      expect(url).toBe(TOKEN_URL)
      const body = new URLSearchParams(options.body as URLSearchParams)
      expect(body.get('grant_type')).toBe('client_credentials')
      expect(body.get('client_id')).toBe('client-id')
      expect(body.get('scope')).toBe(`${BASE}/.default`)
    })

    it('honours an explicit POSTHOLF_SCOPE override', async () => {
      process.env.POSTHOLF_SCOPE = 'api://something/.default'
      fetchMock
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValueOnce(jsonResponse([{ success: true }]))

      await service.registerNotice(registerInput)

      const body = new URLSearchParams(
        fetchMock.mock.calls[0][1].body as URLSearchParams,
      )
      expect(body.get('scope')).toBe('api://something/.default')
    })

    it('caches the token across calls', async () => {
      fetchMock
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValue(jsonResponse([{ success: true }]))

      await service.registerNotice(registerInput)
      await service.registerNotice(registerInput)

      // One token fetch, two registrations.
      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(
        fetchMock.mock.calls.filter((c) => c[0] === TOKEN_URL),
      ).toHaveLength(1)
    })

    it('refreshes once the token has expired', async () => {
      // expires_in 0 means the buffered expiry check is already past.
      fetchMock
        .mockResolvedValueOnce(tokenResponse(0))
        .mockResolvedValueOnce(jsonResponse([{ success: true }]))
        .mockResolvedValueOnce(tokenResponse(0))
        .mockResolvedValueOnce(jsonResponse([{ success: true }]))

      await service.registerNotice(registerInput)
      await service.registerNotice(registerInput)

      expect(
        fetchMock.mock.calls.filter((c) => c[0] === TOKEN_URL),
      ).toHaveLength(2)
    })

    it('raises BadGateway when the token endpoint is unreachable', async () => {
      fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      await expect(service.registerNotice(registerInput)).rejects.toThrow(
        BadGatewayException,
      )
    })

    it('raises BadGateway when the token endpoint rejects the credentials', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 401))

      await expect(service.registerNotice(registerInput)).rejects.toThrow(
        BadGatewayException,
      )
    })

    it('raises InternalServerError when required config is missing', async () => {
      delete process.env.POSTHOLF_CLIENT_SECRET

      await expect(service.registerNotice(registerInput)).rejects.toThrow(
        InternalServerErrorException,
      )
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('registerNotice', () => {
    const register = async (body: unknown, status = 200) => {
      fetchMock
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValueOnce(jsonResponse(body, status))
      return service.registerNotice(registerInput)
    }

    it('posts a single-item array with the sender and pdf fileType', async () => {
      await register([{ success: true }])

      const [url, options] = fetchMock.mock.calls[1]
      expect(url).toBe(`${BASE}/api/v1/documentindexes`)
      expect(options.method).toBe('POST')
      expect(options.headers.Authorization).toBe('Bearer token')
      // No X-Road-Client: Skjalatilkynning is called directly, unlike the
      // application-system service this file is otherwise modelled on.
      expect(options.headers['X-Road-Client']).toBeUndefined()

      const payload = JSON.parse(options.body as string)
      expect(payload).toHaveLength(1)
      expect(payload[0]).toMatchObject({
        kennitala: '5509876543',
        documentId: registerInput.documentId,
        senderKennitala: '5501234567',
        senderName: 'Jafnréttisstofa',
        fileType: 'pdf',
        documentDate: registerInput.documentDate.toISOString(),
      })
    })

    it('treats a 200 carrying success:false as a failure', async () => {
      const result = await register([
        { success: false, errors: ['Unknown category'] },
      ])

      // The whole reason this method does not return void: res.ok was true.
      expect(result.success).toBe(false)
      expect(result.errors).toEqual(['Unknown category'])
    })

    it('treats an empty batch response as a failure', async () => {
      const result = await register([])

      expect(result.success).toBe(false)
    })

    it('treats a non-2xx response as a failure without throwing', async () => {
      const result = await register({}, 500)

      expect(result.success).toBe(false)
      expect(result.errors).toEqual(['Pósthólf responded 500'])
    })

    it('surfaces wantsPaper from the response', async () => {
      const result = await register([{ success: true, wantsPaper: true }])

      expect(result.wantsPaper).toBe(true)
    })

    it('refuses to send a documentId longer than Pósthólf allows', async () => {
      fetchMock.mockResolvedValueOnce(tokenResponse())

      await expect(
        service.registerNotice({
          ...registerInput,
          documentId: 'D'.repeat(51),
        }),
      ).rejects.toThrow(InternalServerErrorException)

      // Failing before the POST matters: an over-long field would be rejected by
      // Pósthólf forever, so retrying it every night is pure noise.
      expect(
        fetchMock.mock.calls.filter((c) => c[0] !== TOKEN_URL),
      ).toHaveLength(0)
    })
  })

  describe('wantsPaper', () => {
    it('reads the paper preference for a kennitala', async () => {
      fetchMock
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValueOnce(jsonResponse({ wantsPaper: true }))

      await expect(service.wantsPaper('5509876543')).resolves.toBe(true)
      expect(fetchMock.mock.calls[1][0]).toBe(`${BASE}/api/v1/5509876543/paper`)
    })

    it('throws rather than assuming "no paper" when the check fails', async () => {
      fetchMock
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValueOnce(jsonResponse({}, 503))

      // Guessing here would electronically serve a recipient who has opted out.
      await expect(service.wantsPaper('5509876543')).rejects.toThrow(
        BadGatewayException,
      )
    })
  })

  describe('withdrawNotice', () => {
    it('posts kennitala, documentId and reason', async () => {
      fetchMock
        .mockResolvedValueOnce(tokenResponse())
        .mockResolvedValueOnce(jsonResponse([{ success: true }]))

      await service.withdrawNotice('5509876543', 'DOC-1', 'sent in error')

      const [url, options] = fetchMock.mock.calls[1]
      expect(url).toBe(`${BASE}/api/v1/documentindexes/withdraw`)
      expect(JSON.parse(options.body as string)).toEqual([
        {
          kennitala: '5509876543',
          documentId: 'DOC-1',
          reason: 'sent in error',
        },
      ])
    })
  })
})
