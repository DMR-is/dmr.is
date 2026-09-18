import {
  hasLoginCooldown,
  LOGIN_COOLDOWN_SECONDS,
  loginCooldownCookie,
} from './loginCooldown'

describe('hasLoginCooldown', () => {
  it('finds the marker when it is the only cookie', () => {
    expect(hasLoginCooldown('dmr.forced_login=1')).toBe(true)
  })

  it('finds the marker alongside other cookies', () => {
    expect(
      hasLoginCooldown('next-auth.csrf-token=abc; dmr.forced_login=1; other=2'),
    ).toBe(true)
  })

  it('reports no cooldown for an empty cookie header', () => {
    expect(hasLoginCooldown('')).toBe(false)
  })

  // The failure this guards: matching by bare prefix would treat an unrelated
  // cookie as a cooldown and suppress a legitimate re-login for a minute.
  it('does not match a different cookie that merely starts the same', () => {
    expect(hasLoginCooldown('dmr.forced_login_elsewhere=1')).toBe(false)
  })

  it('recognises the cookie it writes', () => {
    const written = loginCooldownCookie().split(';')[0]

    expect(hasLoginCooldown(written)).toBe(true)
  })
})

describe('loginCooldownCookie', () => {
  it('is scoped to the whole site and expires on its own', () => {
    const cookie = loginCooldownCookie()

    expect(cookie).toContain(`Max-Age=${LOGIN_COOLDOWN_SECONDS}`)
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('SameSite=Lax')
  })
})
