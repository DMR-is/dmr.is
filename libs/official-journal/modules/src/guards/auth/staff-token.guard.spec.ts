import {
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { StaffTokenGuard } from './staff-token.guard'

const WEB_CLIENT_ID = '@stjornartidindi.is/test-web'

describe('StaffTokenGuard', () => {
  let guard: StaffTokenGuard
  // Restored after each test, so a value direnv exported survives the run
  const exported = process.env.OFFICIAL_JOURNAL_WEB_CLIENT_ID

  const contextFor = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext

  beforeEach(() => {
    process.env.OFFICIAL_JOURNAL_WEB_CLIENT_ID = WEB_CLIENT_ID
    guard = new StaffTokenGuard()
  })

  afterEach(() => {
    if (exported === undefined) {
      delete process.env.OFFICIAL_JOURNAL_WEB_CLIENT_ID
    } else {
      process.env.OFFICIAL_JOURNAL_WEB_CLIENT_ID = exported
    }
  })

  it('allows an id_token issued to official-journal-web', () => {
    expect(guard.canActivate(contextFor({ aud: WEB_CLIENT_ID }))).toBe(true)
    expect(guard.canActivate(contextFor({ aud: [WEB_CLIENT_ID] }))).toBe(true)
  })

  it('allows an aud list that includes official-journal-web', () => {
    expect(
      guard.canActivate(
        contextFor({ aud: `@other.is/client ${WEB_CLIENT_ID}` }),
      ),
    ).toBe(true)
    expect(
      guard.canActivate(
        contextFor({ aud: ['@other.is/client', WEB_CLIENT_ID] }),
      ),
    ).toBe(true)
  })

  it('refuses a token issued to another client', () => {
    expect(() =>
      guard.canActivate(contextFor({ aud: '@other.is/client' })),
    ).toThrow(ForbiddenException)
    expect(() =>
      guard.canActivate(contextFor({ aud: ['@other.is/client'] })),
    ).toThrow(ForbiddenException)
  })

  it('refuses an aud that only contains the client id as a substring', () => {
    expect(() =>
      guard.canActivate(contextFor({ aud: `${WEB_CLIENT_ID}-other` })),
    ).toThrow(ForbiddenException)
    expect(() =>
      guard.canActivate(contextFor({ aud: `x${WEB_CLIENT_ID}` })),
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
    expect(() =>
      guard.canActivate(contextFor({ aud: WEB_CLIENT_ID, actor: {} })),
    ).toThrow(ForbiddenException)
  })

  it('allows a null actor', () => {
    expect(
      guard.canActivate(contextFor({ aud: WEB_CLIENT_ID, actor: null })),
    ).toBe(true)
  })

  it('ignores surrounding whitespace in the client id', () => {
    process.env.OFFICIAL_JOURNAL_WEB_CLIENT_ID = `${WEB_CLIENT_ID}\n`
    expect(guard.canActivate(contextFor({ aud: WEB_CLIENT_ID }))).toBe(true)
  })

  it('fails closed with a 500 when the client id is unset', () => {
    delete process.env.OFFICIAL_JOURNAL_WEB_CLIENT_ID
    expect(() => guard.canActivate(contextFor({ aud: WEB_CLIENT_ID }))).toThrow(
      InternalServerErrorException,
    )
  })
})
