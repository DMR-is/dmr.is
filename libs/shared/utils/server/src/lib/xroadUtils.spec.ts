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

  it('reports a bad id as invalid-id', () => {
    expect.assertions(1)
    try {
      applicationCallbackUrl(BASE, 'not-a-uuid', 'submit')
    } catch (error) {
      expect((error as InvalidCallbackUrlError).reason).toBe('invalid-id')
    }
  })
})

/**
 * Every case above is rejected at the `isUUID` gate, so none of them reaches
 * the origin/pathname guard underneath. `path` is the only input that can, and
 * the type deliberately forbids the hostile values — hence the casts. Without
 * these, a refactor that relaxed or reordered the id check would leave the
 * whole suite green while the last line of defence went unverified.
 */
describe('applicationCallbackUrl origin and path guard', () => {
  // The type forbids these values; the casts are what let the test reach the
  // runtime guard a JS caller or a future refactor could still hit.
  const hostile = (value: string) => value as ApplicationCallbackPath

  it.each([
    ['escapes the base prefix', '../../../../IS-DEV/GOV/1234/other'],
    ['escapes to the origin root', '../../../../../../../../etc/passwd'],
  ])('rejects a path that %s', (_label, path) => {
    expect(() => applicationCallbackUrl(BASE, ID, hostile(path))).toThrow(
      InvalidCallbackUrlError,
    )
  })

  // Pins where the boundary actually sits: dot segments that resolve to
  // somewhere still under the X-Road prefix are harmless and are allowed
  // through. Asserting this stops someone "fixing" the guard into rejecting
  // every `..` and mistaking that for the security property.
  it.each([
    [
      'pops back inside the prefix',
      '..',
      'application-callback-v2/applications/',
    ],
    [
      'stays on a deeper path',
      'a/b',
      `application-callback-v2/applications/${ID}/a/b`,
    ],
  ])('allows a path that %s', (_label, path, expectedTail) => {
    expect(applicationCallbackUrl(BASE, ID, hostile(path))).toBe(
      `${BASE}/${expectedTail}`,
    )
  })
})
