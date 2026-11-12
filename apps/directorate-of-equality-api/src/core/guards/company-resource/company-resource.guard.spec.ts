import { ForbiddenException, UnauthorizedException } from '@nestjs/common'

import { AUTO_PROVISION_COMPANY_METADATA } from '../../decorators/auto-provision-company.decorator'
import { CompanyReadTokenSurface } from '../../decorators/company-read-token-surface.decorator'
import { SelfServiceTokenSurface } from '../../decorators/self-service-token-surface.decorator'
import {
  ISLAND_IS_APPLICATION_SCOPE,
  ISLAND_IS_SALARY_APPLICATION_SCOPE,
  MY_PAGES_SCOPE,
} from '../token-surface/token-surface'
import {
  CompanyResourceGuard,
  CompanyResourceRequest,
} from './company-resource.guard'

// Real decorators on real handlers, read the way the guard reads them, so the
// spec proves the metadata wiring and not a mock of it.
class WriteRoutes {
  handler() {
    return null
  }
}

class ReadRoutes {
  @CompanyReadTokenSurface()
  handler() {
    return null
  }
}

@SelfServiceTokenSurface()
class SelfServiceRoutes {
  handler() {
    return null
  }
}

type Routes = typeof WriteRoutes

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
  let routes: Routes
  let guard: CompanyResourceGuard

  const run = async (
    user: CompanyResourceRequest['user'],
    body?: CompanyResourceRequest['body'],
  ) => {
    const request: CompanyResourceRequest = { user, body }
    await guard.canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => routes.prototype.handler,
      getClass: () => routes,
    } as never)
    return request
  }

  beforeEach(() => {
    getByNationalId = jest.fn().mockResolvedValue({ id: 'company-a' })
    getOrCreateByNationalId = jest.fn().mockResolvedValue({ id: 'company-b' })
    autoProvision = false
    routes = WriteRoutes
    guard = new CompanyResourceGuard(
      logger as never,
      { getByNationalId, getOrCreateByNationalId } as never,
      {
        getAllAndOverride: (key: string) =>
          key === AUTO_PROVISION_COMPANY_METADATA ? autoProvision : undefined,
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

  it('resolves the company for an island.is salary-report token', async () => {
    const request = await run({
      nationalId: '9999999999',
      scope: [ISLAND_IS_SALARY_APPLICATION_SCOPE],
    } as never)

    expect(request.companyContext).toEqual({ id: 'company-a' })
  })

  // My Pages only reads. An undecorated company route files, edits or
  // uploads, so a My Pages token is refused before anything is looked up.
  it('refuses a My Pages token on a write route', async () => {
    await expect(
      run({ nationalId: '9999999999', scope: [MY_PAGES_SCOPE] } as never),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(getByNationalId).not.toHaveBeenCalled()
  })

  describe('on a @CompanyReadTokenSurface() route', () => {
    beforeEach(() => {
      routes = ReadRoutes
    })

    it.each([
      ['My Pages', MY_PAGES_SCOPE],
      ['island.is application', ISLAND_IS_APPLICATION_SCOPE],
      ['island.is salary-report', ISLAND_IS_SALARY_APPLICATION_SCOPE],
    ])('resolves the company for a %s token', async (_label, scope) => {
      const request = await run({
        nationalId: '9999999999',
        scope: [scope],
      } as never)

      expect(request.companyContext).toEqual({ id: 'company-a' })
    })

    it('refuses a token issued for an unrelated scope', async () => {
      await expect(
        run({
          nationalId: '9999999999',
          scope: ['@island.is/documents'],
        } as never),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  it('provisions under @AutoProvisionCompany()', async () => {
    autoProvision = true

    const request = await run(
      {
        nationalId: '9999999999',
        scope: [ISLAND_IS_APPLICATION_SCOPE],
      } as never,
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
      routes = SelfServiceRoutes
    })

    it('resolves the company for a My Pages token', async () => {
      const request = await run({
        nationalId: '9999999999',
        scope: [MY_PAGES_SCOPE],
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
