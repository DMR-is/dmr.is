import { ForbiddenException, UnauthorizedException } from '@nestjs/common'

import {
  ISLAND_IS_APPLICATION_SCOPE,
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
    guard = new CompanyResourceGuard(
      logger as never,
      { getByNationalId, getOrCreateByNationalId } as never,
      { getAllAndOverride: () => autoProvision } as never,
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
})
