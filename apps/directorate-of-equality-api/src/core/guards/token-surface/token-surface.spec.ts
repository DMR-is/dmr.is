import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import {
  assertCompanyToken,
  assertStaffToken,
  ISLAND_IS_APPLICATION_SCOPE,
  PARTNER_WEB_SCOPE,
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

const company = (claims: Record<string, unknown>, scopes?: string[]) => () =>
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

  it('accepts a partner-web token', () => {
    expect(company({ scope: [PARTNER_WEB_SCOPE] })).not.toThrow()
  })

  // IDS serialises a claim with one value as a string, not a one-item array.
  it('accepts a single scope emitted as a string', () => {
    expect(company({ scope: PARTNER_WEB_SCOPE })).not.toThrow()
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
      company({ scope: [ISLAND_IS_APPLICATION_SCOPE] }, [PARTNER_WEB_SCOPE]),
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
