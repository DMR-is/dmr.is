import {
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { StaffTokenGuard } from './staff-token.guard'

const WEB_CLIENT_ID = '@stjornartidindi.is/test-web'

describe('StaffTokenGuard', () => {
  const guard = new StaffTokenGuard()

  const contextFor = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext

  beforeEach(() => {
    process.env.OFFICIAL_JOURNAL_WEB_CLIENT_ID = WEB_CLIENT_ID
  })

  afterEach(() => {
    delete process.env.OFFICIAL_JOURNAL_WEB_CLIENT_ID
  })

  it('allows an id_token issued to official-journal-web', () => {
    expect(guard.canActivate(contextFor({ aud: WEB_CLIENT_ID }))).toBe(true)
    expect(guard.canActivate(contextFor({ aud: [WEB_CLIENT_ID] }))).toBe(true)
  })

  it('refuses a token issued to another client', () => {
    expect(() =>
      guard.canActivate(contextFor({ aud: '@other.is/client' })),
    ).toThrow(ForbiddenException)
  })

  it('refuses a token with no aud, or no user', () => {
    expect(() => guard.canActivate(contextFor({}))).toThrow(ForbiddenException)
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    )
  })

  it('refuses a delegated session, even from the web', () => {
    expect(() =>
      guard.canActivate(
        contextFor({ aud: WEB_CLIENT_ID, actor: { nationalId: '0101010000' } }),
      ),
    ).toThrow(ForbiddenException)
  })

  it('fails closed with a 500 when the client id is unset', () => {
    delete process.env.OFFICIAL_JOURNAL_WEB_CLIENT_ID
    expect(() => guard.canActivate(contextFor({ aud: WEB_CLIENT_ID }))).toThrow(
      InternalServerErrorException,
    )
  })
})
