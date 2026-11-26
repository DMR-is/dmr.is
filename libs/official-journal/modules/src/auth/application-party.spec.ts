import {
  includesId,
  involvedPartyIdsOf,
  isApplicationParty,
  normalizeNationalId,
} from './application-party'

describe('isApplicationParty', () => {
  const application = {
    applicant: '0101010000',
    assignees: ['0202020000'],
  }

  it('allows the applicant, comparing digits only', () => {
    expect(isApplicationParty(application, { nationalId: '010101-0000' })).toBe(
      true,
    )
  })

  it('allows an assignee', () => {
    expect(isApplicationParty(application, { nationalId: '0202020000' })).toBe(
      true,
    )
  })

  it('denies an unrelated caller', () => {
    expect(isApplicationParty(application, { nationalId: '0505050000' })).toBe(
      false,
    )
  })

  it('denies someone who once acted for the applicant, signed in as themselves', () => {
    const withActors = { ...application, applicantActors: ['0303030000'] }

    expect(isApplicationParty(withActors, { nationalId: '0303030000' })).toBe(
      false,
    )
  })

  it('denies a caller with no identity, even against an empty applicant', () => {
    expect(isApplicationParty(application, {})).toBe(false)
    expect(isApplicationParty({ ...application, applicant: '' }, {})).toBe(
      false,
    )
  })
})

describe('involvedPartyIdsOf', () => {
  it('handles ids, party objects and nothing', () => {
    expect(involvedPartyIdsOf(['a', 'b'])).toEqual(['a', 'b'])
    expect(involvedPartyIdsOf([{ id: 'a' }])).toEqual(['a'])
    expect(involvedPartyIdsOf(undefined)).toEqual([])
  })
})

describe('includesId', () => {
  it('matches an id whatever its case, and nothing else', () => {
    expect(
      includesId(
        ['6f1c1a3e-2b4d-4c5e-9f60-7a8b9c0d1e2f'],
        '6F1C1A3E-2B4D-4C5E-9F60-7A8B9C0D1E2F',
      ),
    ).toBe(true)
    expect(
      includesId(
        ['6F1C1A3E-2B4D-4C5E-9F60-7A8B9C0D1E2F'],
        '6f1c1a3e-2b4d-4c5e-9f60-7a8b9c0d1e2f',
      ),
    ).toBe(true)
    expect(
      includesId(
        ['6f1c1a3e-2b4d-4c5e-9f60-7a8b9c0d1e2f'],
        '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
      ),
    ).toBe(false)
    expect(includesId(undefined, '6f1c1a3e-2b4d-4c5e-9f60-7a8b9c0d1e2f')).toBe(
      false,
    )
  })
})

describe('normalizeNationalId', () => {
  it('keeps digits only, and tolerates a missing id', () => {
    expect(normalizeNationalId('010101-0000')).toBe('0101010000')
    expect(normalizeNationalId(undefined)).toBe('')
  })
})
