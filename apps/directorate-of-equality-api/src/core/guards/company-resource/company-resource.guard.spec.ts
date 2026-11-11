import { ForbiddenException, UnauthorizedException } from '@nestjs/common'

import { AUTO_PROVISION_COMPANY_METADATA } from '../../decorators/auto-provision-company.decorator'
import { SELF_SERVICE_TOKEN_SURFACE_METADATA } from '../../decorators/self-service-token-surface.decorator'
import {
  ISLAND_IS_APPLICATION_SCOPE,
  ISLAND_IS_SALARY_APPLICATION_SCOPE,
  PARTNER_WEB_SCOPE,
} from '../token-surface/token-surface'
import {
  CompanyResourceGuard,
  CompanyResourceRequest,
} from './company-resource.guard'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('CompanyResourceGuard', () => {
  let getByNationalId: jest.Mock
  let getOrCreateByNationalId: jest.Mock
  let autoProvision: boolean
  let selfService: boolean
  let guard: CompanyResourceGuard

  const run = async (
    user: CompanyResourceRequest['user'],
    body?: CompanyResourceRequest['body'],
  ) => {
    const request: CompanyResourceRequest = { user, body }
    await guard.canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as never)
    return request
  }

  beforeEach(() => {
    getByNationalId = jest.fn().mockResolvedValue({ id: 'company-a' })
    getOrCreateByNationalId = jest.fn().mockResolvedValue({ id: 'company-b' })
    autoProvision = false
    selfService = false
    guard = new CompanyResourceGuard(
      logger as never,
      { getByNationalId, getOrCreateByNationalId } as never,
      {
        getAllAndOverride: (key: string) =>
          key === AUTO_PROVISION_COMPANY_METADATA
            ? autoProvision
            : key === SELF_SERVICE_TOKEN_SURFACE_METADATA
              ? selfService
              : undefined,
      } as never,
    )
  })

  it('resolves the company for an island.is application token', async () => {
    const request = await run({
      nationalId: '9999999999',
      scope: [ISLAND_IS_APPLICATION_SCOPE],
    } as never)

    expect(getByNationalId).toHaveBeenCalledWith('9999999999')
    expect(request.companyContext).toEqual({ id: 'company-a' })
  })

  it('resolves the company for a partner-web token', async () => {
    const request = await run({
      nationalId: '9999999999',
      scope: [PARTNER_WEB_SCOPE],
    } as never)

    expect(request.companyContext).toEqual({ id: 'company-a' })
  })

  it('provisions under @AutoProvisionCompany()', async () => {
    autoProvision = true

    const request = await run(
      { nationalId: '9999999999', scope: [PARTNER_WEB_SCOPE] } as never,
      { company: { name: ' Fyrirtæki ehf. ' } },
    )

    expect(getOrCreateByNationalId).toHaveBeenCalledWith(
      '9999999999',
      'Fyrirtæki ehf.',
    )
    expect(request.companyContext).toEqual({ id: 'company-b' })
  })

  // The F1/F2 replay: a token IDS issued for some other service, carrying the
  // company's kennitala. Nothing may be looked up, let alone provisioned.
  it('refuses a token issued for an unrelated scope', async () => {
    autoProvision = true

    await expect(
      run({
        nationalId: '9999999999',
        scope: ['@island.is/documents'],
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(getByNationalId).not.toHaveBeenCalled()
    expect(getOrCreateByNationalId).not.toHaveBeenCalled()
  })

  it('refuses an id_token, which carries no scope', async () => {
    await expect(
      run({ nationalId: '9999999999', aud: 'doe-web-client' } as never),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(getByNationalId).not.toHaveBeenCalled()
  })

  it('refuses a token with no kennitala', async () => {
    await expect(run(undefined)).rejects.toBeInstanceOf(UnauthorizedException)
    expect(getByNationalId).not.toHaveBeenCalled()
  })

  describe('on a @SelfServiceTokenSurface() route', () => {
    beforeEach(() => {
      selfService = true
    })

    it('resolves the company for a partner-web token', async () => {
      const request = await run({
        nationalId: '9999999999',
        scope: [PARTNER_WEB_SCOPE],
      } as never)

      expect(request.companyContext).toEqual({ id: 'company-a' })
    })

    // island.is application tokens may file reports, but must not mint a
    // long-lived API key or grant a delegation.
    it.each([
      ['island.is application', ISLAND_IS_APPLICATION_SCOPE],
      ['island.is salary-report', ISLAND_IS_SALARY_APPLICATION_SCOPE],
    ])('refuses an %s token', async (_label, scope) => {
      await expect(
        run({ nationalId: '9999999999', scope: [scope] } as never),
      ).rejects.toBeInstanceOf(ForbiddenException)
      expect(getByNationalId).not.toHaveBeenCalled()
    })

    it('refuses a delegated session without the self-service scope', async () => {
      await expect(
        run({
          nationalId: '9999999999',
          scope: ['@island.is/documents'],
          actor: { nationalId: '1111111111' },
        } as never),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })
})
