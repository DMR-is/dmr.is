import { involvedPartyIdsOf, isApplicationParty } from './application-party'

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
