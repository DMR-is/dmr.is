import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { ApiKeyKindEnum, ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { ApiKeyContext } from '../../../modules/api-key/api-key.types'
import {
  COMPANY_NATIONAL_ID_HEADER,
  PartnerCompanyGuard,
  PartnerCompanyRequest,
} from './partner-company.guard'

/** Placeholder kennitölur — shape only, never checksum-valid. */
const COMPANY_X = '1111111111'
const COMPANY_Y = '2222222222'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const companyKey: ApiKeyContext = {
  kind: ApiKeyKindEnum.COMPANY,
  id: 'key-1',
  keyId: 'aaaaaaaaaaaaaaa1',
  companyId: 'company-x',
  companyNationalId: COMPANY_X,
  scopes: [ApiKeyScopeEnum.REPORT_READ],
}

const clientKey: ApiKeyContext = {
  kind: ApiKeyKindEnum.PARTNER_CLIENT,
  id: 'client-key-1',
  keyId: 'bbbbbbbbbbbbbbb1',
  partnerClientId: 'client-a',
  scopes: [
    ApiKeyScopeEnum.REPORT_READ,
    ApiKeyScopeEnum.SALARY_SUBMIT,
    ApiKeyScopeEnum.SCORING_WRITE,
  ],
}

/**
 * The tenant boundary for vendor keys. Every branch here is a way a firm could
 * end up acting for a company that never allowed it, so each is pinned.
 */
describe('PartnerCompanyGuard', () => {
  let getByNationalId: jest.Mock
  let findLive: jest.Mock
  let guard: PartnerCompanyGuard

  const run = async (
    apiKeyContext: ApiKeyContext | undefined,
    headers: Record<string, string | string[] | undefined> = {},
  ) => {
    const request: PartnerCompanyRequest = { headers, apiKeyContext }
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as never

    await guard.canActivate(context)

    return request
  }

  beforeEach(() => {
    jest.clearAllMocks()
    getByNationalId = jest
      .fn()
      .mockImplementation(async (nationalId: string) => ({
        id: `company-${nationalId}`,
        nationalId,
      }))
    // Client A is delegated by company X only, for read and salary.
    findLive = jest
      .fn()
      .mockImplementation(
        async (partnerClientId: string, nationalId: string) =>
          partnerClientId === 'client-a' && nationalId === COMPANY_X
            ? {
                companyNationalId: COMPANY_X,
                scopes: [
                  ApiKeyScopeEnum.REPORT_READ,
                  ApiKeyScopeEnum.SALARY_SUBMIT,
                ],
              }
            : null,
      )

    guard = new PartnerCompanyGuard(
      logger as never,
      { getByNationalId } as never,
      { findLive } as never,
    )
  })

  it('refuses to run without ApiKeyGuard before it', async () => {
    await expect(run(undefined)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    )
  })

  describe('a company key', () => {
    it('resolves the company the key names, unchanged', async () => {
      const request = await run(companyKey)

      expect(getByNationalId).toHaveBeenCalledWith(COMPANY_X)
      expect(request.companyContext?.nationalId).toBe(COMPANY_X)
      expect(request.partnerClientId).toBeUndefined()
      expect(findLive).not.toHaveBeenCalled()
    })

    it('is refused with X-Company-National-Id, rather than letting the header mean anything', async () => {
      await expect(
        run(companyKey, { [COMPANY_NATIONAL_ID_HEADER]: COMPANY_Y }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(getByNationalId).not.toHaveBeenCalled()
    })
  })

  describe('a vendor client key', () => {
    it('acts for a company that delegated to it', async () => {
      const request = await run(clientKey, {
        [COMPANY_NATIONAL_ID_HEADER]: COMPANY_X,
      })

      expect(findLive).toHaveBeenCalledWith('client-a', COMPANY_X)
      expect(request.companyContext?.nationalId).toBe(COMPANY_X)
      expect(request.partnerClientId).toBe('client-a')
    })

    it('accepts the hyphenated kennitala form', async () => {
      const request = await run(clientKey, {
        [COMPANY_NATIONAL_ID_HEADER]: `${COMPANY_X.slice(0, 6)}-${COMPANY_X.slice(6)}`,
      })

      expect(request.companyContext?.nationalId).toBe(COMPANY_X)
    })

    it('cannot act for a company that did not delegate to it', async () => {
      await expect(
        run(clientKey, { [COMPANY_NATIONAL_ID_HEADER]: COMPANY_Y }),
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(getByNationalId).not.toHaveBeenCalled()
    })

    it('cannot act for a company once the delegation is withdrawn', async () => {
      // findLive filters on revoked_at IS NULL, so a withdrawn delegation is
      // indistinguishable from none.
      findLive.mockResolvedValue(null)

      await expect(
        run(clientKey, { [COMPANY_NATIONAL_ID_HEADER]: COMPANY_X }),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })

    it('is a 400 naming the header when it is missing — not a 401', async () => {
      const error = await run(clientKey).catch((e) => e)

      expect(error).toBeInstanceOf(BadRequestException)
      expect(error.message).toContain('X-Company-National-Id')
    })

    it.each([
      ['too short', '12345'],
      ['not digits', 'abcdefghij'],
      ['two companies at once', [COMPANY_X, COMPANY_Y]],
    ])('refuses a header that is %s', async (_label, value) => {
      await expect(
        run(clientKey, { [COMPANY_NATIONAL_ID_HEADER]: value }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(findLive).not.toHaveBeenCalled()
    })

    /**
     * The firm may do at most what it was approved for, and for this company at
     * most what the company allowed. Company X granted read and salary; the
     * firm holds scoring:write too, but not for X.
     */
    it('narrows the scopes to the intersection with the delegation', async () => {
      const request = await run(clientKey, {
        [COMPANY_NATIONAL_ID_HEADER]: COMPANY_X,
      })

      expect(request.apiKeyContext?.scopes).toEqual([
        ApiKeyScopeEnum.REPORT_READ,
        ApiKeyScopeEnum.SALARY_SUBMIT,
      ])
    })

    it('grants nothing a delegation allows but the firm was never approved for', async () => {
      findLive.mockResolvedValue({
        companyNationalId: COMPANY_X,
        scopes: [ApiKeyScopeEnum.EQUALITY_SUBMIT, ApiKeyScopeEnum.REPORT_READ],
      })

      const request = await run(clientKey, {
        [COMPANY_NATIONAL_ID_HEADER]: COMPANY_X,
      })

      expect(request.apiKeyContext?.scopes).toEqual([
        ApiKeyScopeEnum.REPORT_READ,
      ])
    })

    it('resolves the tenant from the delegation, not from the raw header', async () => {
      await run(clientKey, { [COMPANY_NATIONAL_ID_HEADER]: COMPANY_X })

      expect(getByNationalId).toHaveBeenCalledWith(COMPANY_X)
    })
  })
})
