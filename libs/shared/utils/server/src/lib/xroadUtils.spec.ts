import { applicationCallbackUrl, InvalidCallbackUrlError } from './xroadUtils'

const BASE = 'https://securityserver.internal/r1/IS-DEV/GOV/10000/dmr'
const ID = '3f8a1c2e-5b7d-4e91-a0c6-8d2f4b6e9a13'

describe('applicationCallbackUrl', () => {
  it('places the application id under the configured X-Road path', () => {
    expect(applicationCallbackUrl(BASE, ID)).toBe(
      `${BASE}/application-callback-v2/applications/${ID}`,
    )
  })

  it('appends the trailing path segment', () => {
    expect(applicationCallbackUrl(BASE, ID, 'submit')).toBe(
      `${BASE}/application-callback-v2/applications/${ID}/submit`,
    )
  })

  it('keeps every segment of a base path configured with a trailing slash', () => {
    expect(applicationCallbackUrl(`${BASE}/`, ID, 'submit')).toBe(
      `${BASE}/application-callback-v2/applications/${ID}/submit`,
    )
  })

  it.each([
    ['dot segments', '../../../../IS-DEV/GOV/1234567890/other/service'],
    ['a leading segment then dot segments', 'a/../../../r1/IS-DEV/GOV/10000/x'],
    ['a bare dot-dot', '..'],
    ['a single dot', '.'],
    ['an absolute URL', 'https://attacker.example/collect'],
    ['a protocol-relative URL', '//attacker.example/collect'],
    ['a query string', `${ID}?event=APPROVE`],
    ['a fragment', `${ID}#x`],
    ['an encoded traversal', '%2e%2e%2f%2e%2e%2fadmin'],
    ['an empty string', ''],
    ['a non-UUID handle', 'application-1'],
    ['a UUID with trailing path', `${ID}/../../elsewhere`],
  ])('rejects %s', (_label, applicationId) => {
    expect(() => applicationCallbackUrl(BASE, applicationId, 'submit')).toThrow(
      InvalidCallbackUrlError,
    )
  })
})

describe('applicationCallbackUrl base path handling', () => {
  it.each([
    ['an unset env var', 'undefined'],
    ['an empty base path', ''],
    ['a relative base path', '/r1/IS-DEV'],
  ])('rejects %s', (_label, basePath) => {
    expect(() => applicationCallbackUrl(basePath, ID, 'submit')).toThrow(
      InvalidCallbackUrlError,
    )
  })
})
