import { ExecutionContext } from '@nestjs/common'

import { MachineClientGuard } from './machine-client.guard'

describe('MachineClientGuard', () => {
  const guard = new MachineClientGuard()

  const contextFor = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext

  afterEach(() => {
    delete process.env.LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES
  })

  it('allows a token carrying the configured scope', () => {
    process.env.LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES = '@lg.is/machine'
    expect(
      guard.canActivate(contextFor({ scope: 'openid @lg.is/machine' })),
    ).toBe(true)
    expect(guard.canActivate(contextFor({ scope: ['@lg.is/machine'] }))).toBe(
      true,
    )
  })

  it('refuses a scope that only contains the configured one as a substring', () => {
    process.env.LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES = '@lg.is/machine'
    expect(
      guard.canActivate(contextFor({ scope: '@lg.is/machine-other' })),
    ).toBe(false)
    expect(guard.canActivate(contextFor({ scope: 'x@lg.is/machine' }))).toBe(
      false,
    )
  })

  it('requires every configured scope', () => {
    process.env.LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES = '@lg.is/a, @lg.is/b'
    expect(guard.canActivate(contextFor({ scope: '@lg.is/a' }))).toBe(false)
    expect(guard.canActivate(contextFor({ scope: '@lg.is/b @lg.is/a' }))).toBe(
      true,
    )
  })

  it('refuses everyone when the variable is unset or empty', () => {
    expect(guard.canActivate(contextFor({ scope: 'undefined' }))).toBe(false)
    process.env.LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES = ' '
    expect(guard.canActivate(contextFor({ scope: ' ' }))).toBe(false)
  })

  it('refuses a request with no user or no scope', () => {
    process.env.LEGAL_GAZETTE_MACHINE_CLIENT_SCOPES = '@lg.is/machine'
    expect(guard.canActivate(contextFor(undefined))).toBe(false)
    expect(guard.canActivate(contextFor({}))).toBe(false)
  })
})
