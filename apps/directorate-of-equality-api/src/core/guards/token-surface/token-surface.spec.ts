import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { CompanyReadTokenSurface } from '../../decorators/company-read-token-surface.decorator'
import { SelfServiceTokenSurface } from '../../decorators/self-service-token-surface.decorator'
import {
  assertCompanyToken,
  assertStaffToken,
  COMPANY_READ_TOKEN_SCOPES,
  COMPANY_TOKEN_SCOPES,
  companyTokenScopesFor,
  ISLAND_IS_APPLICATION_SCOPE,
  ISLAND_IS_SALARY_APPLICATION_SCOPE,
  MY_PAGES_SCOPE,
  SELF_SERVICE_TOKEN_SCOPES,
} from './token-surface'

const STAFF_CLIENT_ID = 'doe-web-client'
const CONTEXT = 'TokenSurfaceSpec'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const token = (claims: Record<string, unknown>): DMRUser =>
  ({ nationalId: '0000000000', ...claims }) as unknown as DMRUser

const company =
  (claims: Record<string, unknown>, scopes?: ReadonlyArray<string>) => () =>
    assertCompanyToken(token(claims), logger as never, CONTEXT, scopes)

const staff = (claims: Record<string, unknown>) => () =>
  assertStaffToken(token(claims), logger as never, CONTEXT)

describe('assertCompanyToken', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts an island.is application token', () => {
    expect(
      company({ scope: ['openid', ISLAND_IS_APPLICATION_SCOPE] }),
    ).not.toThrow()
  })

  // The salary-report template requires its own scope, not the one above.
  it('accepts an island.is salary-report application token', () => {
    expect(
      company({ scope: ['openid', ISLAND_IS_SALARY_APPLICATION_SCOPE] }),
    ).not.toThrow()
  })

  it('refuses a scope that only starts with a DoE scope', () => {
    expect(
      company({ scope: [`${ISLAND_IS_APPLICATION_SCOPE}-other`] }),
    ).toThrow(ForbiddenException)
  })

  // partner-web never reached production and is being replaced by My Pages,
  // so its scope no longer opens any company route.
  it("refuses partner-web's retired scope", () => {
    expect(company({ scope: ['@jafnretti.is/doe-partner-web'] })).toThrow(
      ForbiddenException,
    )
  })

  // The default list is for routes that file or edit; My Pages only reads.
  it('refuses a My Pages token on the default (write) list', () => {
    expect(company({ scope: [MY_PAGES_SCOPE] })).toThrow(ForbiddenException)
  })

  it('accepts a My Pages token on the read list', () => {
    expect(
      company({ scope: [MY_PAGES_SCOPE] }, COMPANY_READ_TOKEN_SCOPES),
    ).not.toThrow()
  })

  // IDS serialises a claim with one value as a string, not a one-item array.
  it('accepts a single scope emitted as a string', () => {
    expect(company({ scope: ISLAND_IS_APPLICATION_SCOPE })).not.toThrow()
  })

  it('accepts a delegated token, since that is how a person acts for a company', () => {
    expect(
      company({
        scope: [ISLAND_IS_APPLICATION_SCOPE],
        actor: { nationalId: '1111111111' },
      }),
    ).not.toThrow()
  })

  it('refuses a token issued for an unrelated scope', () => {
    expect(company({ scope: ['@island.is/documents'] })).toThrow(
      ForbiddenException,
    )
    expect(logger.warn).toHaveBeenCalled()
  })

  it('refuses an id_token, which has no scope claim', () => {
    expect(company({ aud: STAFF_CLIENT_ID })).toThrow(ForbiddenException)
  })

  it('refuses a scope outside the allowed list it is given', () => {
    expect(
      company({ scope: [ISLAND_IS_APPLICATION_SCOPE] }, [MY_PAGES_SCOPE]),
    ).toThrow(ForbiddenException)
  })
})

describe('assertStaffToken', () => {
  const original = process.env.DOE_WEB_CLIENT_ID

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DOE_WEB_CLIENT_ID = STAFF_CLIENT_ID
  })

  afterAll(() => {
    if (original === undefined) {
      delete process.env.DOE_WEB_CLIENT_ID
    } else {
      process.env.DOE_WEB_CLIENT_ID = original
    }
  })

  it("accepts doe-web's own id_token", () => {
    expect(staff({ aud: STAFF_CLIENT_ID })).not.toThrow()
  })

  it('accepts an audience emitted as an array', () => {
    expect(staff({ aud: [STAFF_CLIENT_ID] })).not.toThrow()
  })

  it('refuses an id_token issued to another IDS client', () => {
    expect(staff({ aud: 'some-other-client' })).toThrow(ForbiddenException)
    expect(logger.warn).toHaveBeenCalled()
  })

  it('refuses an access token, even one carrying a DoE scope', () => {
    expect(
      staff({
        aud: '@island.is',
        client_id: 'some-other-client',
        scope: [ISLAND_IS_APPLICATION_SCOPE],
      }),
    ).toThrow(ForbiddenException)
  })

  it('refuses a delegated session for a reviewer', () => {
    expect(
      staff({ aud: STAFF_CLIENT_ID, actor: { nationalId: '1111111111' } }),
    ).toThrow(ForbiddenException)
  })

  it('fails closed when the client id is not configured', () => {
    delete process.env.DOE_WEB_CLIENT_ID

    expect(staff({ aud: STAFF_CLIENT_ID })).toThrow(
      InternalServerErrorException,
    )
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('DOE_WEB_CLIENT_ID'),
      expect.anything(),
    )
  })
})

describe('companyTokenScopesFor', () => {
  class Unmarked {
    handler() {
      return null
    }
  }

  class Marked {
    @CompanyReadTokenSurface()
    read() {
      return null
    }

    write() {
      return null
    }
  }

  @SelfServiceTokenSurface()
  class SelfService {
    handler() {
      return null
    }
  }

  it('defaults to the write list, which never holds the My Pages scope', () => {
    expect(companyTokenScopesFor(Unmarked.prototype.handler, Unmarked)).toBe(
      COMPANY_TOKEN_SCOPES,
    )
    expect(COMPANY_TOKEN_SCOPES).not.toContain(MY_PAGES_SCOPE)
  })

  it('gives a @CompanyReadTokenSurface() handler the read list', () => {
    expect(companyTokenScopesFor(Marked.prototype.read, Marked)).toBe(
      COMPANY_READ_TOKEN_SCOPES,
    )
    expect(COMPANY_READ_TOKEN_SCOPES).toContain(MY_PAGES_SCOPE)
  })

  it("does not widen the decorated handler's siblings", () => {
    expect(companyTokenScopesFor(Marked.prototype.write, Marked)).toBe(
      COMPANY_TOKEN_SCOPES,
    )
  })

  it('gives a @SelfServiceTokenSurface() controller the self-service list', () => {
    expect(
      companyTokenScopesFor(SelfService.prototype.handler, SelfService),
    ).toBe(SELF_SERVICE_TOKEN_SCOPES)
  })
})
