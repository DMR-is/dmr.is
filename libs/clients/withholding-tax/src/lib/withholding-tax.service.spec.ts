import type { Logger } from '@dmr.is/logging'

import { WithholdingTaxError } from './withholding-tax.errors'
import { WithholdingTaxService } from './withholding-tax.service'
import {
  TOKEN_EXPIRY_SKEW_MS,
  tokenExpiresAt,
  WithholdingTaxTokenCache,
} from './withholding-tax-token'

const BASE = 'https://rsk.test/ws/withholdingtax'

const ROW = {
  incomeYear: 2025,
  companyId: '1234567890',
  companyName: 'Dæmi ehf.',
  legalAddress: 'Klapparstíg 30',
  zipCode: 101,
  cityid: '0000',
  city: 'Reykjavík',
  isatId: '56100',
  isatText: 'Veitingastaðir',
  jobCount: '50+',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const tokenResponse = (token = 'tok-1') =>
  json({ access_token: token, token_type: 'Bearer', expires_in: 25200 })

const logger = () =>
  ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }) as unknown as Logger

describe('WithholdingTaxService', () => {
  const env = process.env
  let fetchMock: jest.SpyInstance

  beforeEach(() => {
    process.env = {
      ...env,
      RSK_WITHHOLDING_TAX_API_PATH: `${BASE}/`,
      RSK_WITHHOLDING_TAX_USERNAME: 'user',
      RSK_WITHHOLDING_TAX_PASSWORD: 'secret',
    }
    fetchMock = jest.spyOn(global, 'fetch')
  })

  afterEach(() => {
    process.env = env
    fetchMock.mockRestore()
  })

  it('logs in, then fetches and maps the job counts', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(json([ROW]))
    const service = new WithholdingTaxService(logger())

    const result = await service.getJobCounts(2025)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${BASE}/token`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'user', password: 'secret' }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${BASE}/GetJobCount/2025`,
      expect.objectContaining({
        headers: { Authorization: 'Bearer tok-1' },
      }),
    )
    expect(result).toEqual({
      incomeYear: 2025,
      skipped: [],
      companies: [
        {
          incomeYear: 2025,
          nationalId: '1234567890',
          name: 'Dæmi ehf.',
          legalAddress: 'Klapparstíg 30',
          postcode: '101',
          cityId: '0000',
          city: 'Reykjavík',
          isatCode: '56100',
          isatText: 'Veitingastaðir',
          jobCountBand: '50+',
        },
      ],
    })
  })

  it('reuses the token across calls', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(json([]))
    const service = new WithholdingTaxService(logger())

    await service.getJobCounts(2024)
    await service.getJobCounts(2025)

    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('re-logs in once and retries when the token is refused', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('old'))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(tokenResponse('new'))
      .mockResolvedValueOnce(json([ROW]))
    const service = new WithholdingTaxService(logger())

    const result = await service.getJobCounts(2025)

    expect(result.companies).toHaveLength(1)
    expect(fetchMock.mock.calls[3][1].headers).toEqual({
      Authorization: 'Bearer new',
    })
  })

  it('fails AUTH_FAILED when a fresh token is refused too', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('old'))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(tokenResponse('new'))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
    const service = new WithholdingTaxService(logger())

    await expect(service.getJobCounts(2025)).rejects.toMatchObject({
      reason: 'AUTH_FAILED',
      operation: 'getJobCount',
    })
  })

  it('fails AUTH_FAILED when the credentials are rejected', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 401 }))
    const service = new WithholdingTaxService(logger())

    await expect(service.checkConnection()).rejects.toMatchObject({
      reason: 'AUTH_FAILED',
      operation: 'token',
    })
  })

  it('fails NOT_CONFIGURED without calling out', async () => {
    delete process.env.RSK_WITHHOLDING_TAX_PASSWORD
    const service = new WithholdingTaxService(logger())

    await expect(service.getJobCounts(2025)).rejects.toMatchObject({
      reason: 'NOT_CONFIGURED',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips invalid rows and keeps the rest', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        json([ROW, { ...ROW, companyId: '123', jobCount: '0-24' }]),
      )
    const log = logger()
    const service = new WithholdingTaxService(log)

    const result = await service.getJobCounts(2025)

    expect(result.companies).toHaveLength(1)
    expect(result.skipped).toEqual([
      {
        index: 1,
        issues: expect.arrayContaining([
          expect.stringMatching(/^companyId:/),
          expect.stringMatching(/^jobCount:/),
        ]),
      },
    ])
    expect(log.warn).toHaveBeenCalled()
  })

  it('fails INVALID_RESPONSE when the body is not an array', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(json({ items: [ROW] }))
    const service = new WithholdingTaxService(logger())

    await expect(service.getJobCounts(2025)).rejects.toMatchObject({
      reason: 'INVALID_RESPONSE',
    })
  })

  it('fails HTTP_ERROR on a 500', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
    const service = new WithholdingTaxService(logger())

    await expect(service.getJobCounts(2025)).rejects.toMatchObject({
      reason: 'HTTP_ERROR',
      status: 500,
    })
  })

  it('fails NETWORK_ERROR when fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    const service = new WithholdingTaxService(logger())

    const error = await service.checkConnection().catch((e) => e)

    expect(error).toBeInstanceOf(WithholdingTaxError)
    expect(error.reason).toBe('NETWORK_ERROR')
  })

  it('never puts the password or token in a log', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('tok-secret'))
      .mockResolvedValueOnce(new Response('boom', { status: 500 }))
    const log = logger()
    const service = new WithholdingTaxService(log)

    await service.getJobCounts(2025).catch(() => undefined)

    const logged = JSON.stringify([
      (log.info as jest.Mock).mock.calls,
      (log.warn as jest.Mock).mock.calls,
      (log.error as jest.Mock).mock.calls,
    ])
    expect(logged).not.toContain('secret')
  })

  it('rejects a non-integer income year', async () => {
    const service = new WithholdingTaxService(logger())
    await expect(service.getJobCounts(2025.5)).rejects.toThrow(RangeError)
  })
})

describe('WithholdingTaxTokenCache', () => {
  it('refreshes after expiry and shares a single in-flight login', async () => {
    let now = 0
    const cache = new WithholdingTaxTokenCache(() => now)
    let n = 0
    const login = jest.fn(async () => ({
      value: `t${++n}`,
      expiresAt: now + 1_000,
    }))

    const [a, b] = await Promise.all([cache.get(login), cache.get(login)])
    expect([a, b]).toEqual(['t1', 't1'])
    expect(login).toHaveBeenCalledTimes(1)

    now = 1_000
    expect(await cache.get(login)).toBe('t2')
  })

  it('does not cache a failed login', async () => {
    const cache = new WithholdingTaxTokenCache(() => 0)
    const login = jest
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce({ value: 'ok', expiresAt: 10_000 })

    await expect(cache.get(login)).rejects.toThrow('down')
    expect(await cache.get(login)).toBe('ok')
  })

  it('expires a token the skew before expires_in', () => {
    expect(tokenExpiresAt(25200, 0)).toBe(25200_000 - TOKEN_EXPIRY_SKEW_MS)
  })
})
