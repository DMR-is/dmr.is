import { isCompanySubject } from './companySubject'

// The gate exists because both a company session and an individual session
// carry a `nationalId` -- an individual's is simply their own kennitala. Only
// `subjectType` separates them, and getting this wrong is not visible here:
// CompanyResourceGuard would resolve, or provision, a company from whatever
// national id it is handed.
describe('isCompanySubject', () => {
  const company = {
    subjectType: 'legalEntity',
    nationalId: '5501234567',
    actor: { nationalId: '1234567890', name: 'Test Testsson', scope: [] },
  }

  it('admits a company reached through procuration', () => {
    expect(isCompanySubject(company)).toBe(true)
  })

  it('admits a company that authenticated as itself, with no actor', () => {
    // resolve-actor.ts documents this case explicitly, which is why the gate
    // cannot key on the absence of `actor`.
    const { actor: _actor, ...withoutActor } = company

    expect(isCompanySubject(withoutActor)).toBe(true)
  })

  it('refuses an individual signing in as themselves', () => {
    expect(
      isCompanySubject({ subjectType: 'person', nationalId: '1234567890' }),
    ).toBe(false)
  })

  it('refuses a token with no subjectType at all', () => {
    expect(isCompanySubject({ nationalId: '5501234567' })).toBe(false)
  })

  it('refuses a company subject carrying no national id', () => {
    expect(isCompanySubject({ subjectType: 'legalEntity' })).toBe(false)
  })
})
