import { formatNationalId, isNarrowGrant, issuedBy, keyState } from './format'

describe('keyState', () => {
  const past = '2020-01-01T00:00:00.000Z'
  const future = '2999-01-01T00:00:00.000Z'

  it('is active with no revocation and no expiry', () => {
    expect(keyState({})).toBe('active')
    expect(keyState({ expiresAt: future })).toBe('active')
  })

  it('is expired once the expiry has passed', () => {
    expect(keyState({ expiresAt: past })).toBe('expired')
  })

  it('reads revoked before expired when a key is both', () => {
    expect(keyState({ revokedAt: past, expiresAt: past })).toBe('revoked')
  })
})

describe('issuedBy', () => {
  it('names Jafnréttisstofa for a reviewer-issued key', () => {
    expect(issuedBy({ createdVia: 'ADMIN', createdByNationalId: null })).toBe(
      'Jafnréttisstofa',
    )
  })

  it('shows the issuing person’s kennitala on the self-service path', () => {
    expect(
      issuedBy({ createdVia: 'ISLAND_IS', createdByNationalId: '0000000000' }),
    ).toBe('000000-0000')
  })
})

describe('formatNationalId', () => {
  it('hyphenates ten digits and leaves anything else alone', () => {
    expect(formatNationalId('0000000000')).toBe('000000-0000')
    expect(formatNationalId('123')).toBe('123')
  })
})

describe('isNarrowGrant', () => {
  it('is false for the full set, in any order', () => {
    expect(
      isNarrowGrant([
        'scoring:write',
        'report:read',
        'equality:submit',
        'salary:submit',
      ]),
    ).toBe(false)
  })

  it('is true when any one scope is missing, not only scoring:write', () => {
    expect(
      isNarrowGrant(['report:read', 'salary:submit', 'equality:submit']),
    ).toBe(true)
    expect(
      isNarrowGrant(['report:read', 'salary:submit', 'scoring:write']),
    ).toBe(true)
    expect(
      isNarrowGrant(['salary:submit', 'equality:submit', 'scoring:write']),
    ).toBe(true)
    expect(
      isNarrowGrant(['report:read', 'equality:submit', 'scoring:write']),
    ).toBe(true)
  })

  it('is true for an empty set', () => {
    expect(isNarrowGrant([])).toBe(true)
  })
})
