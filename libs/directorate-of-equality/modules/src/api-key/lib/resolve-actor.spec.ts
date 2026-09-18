import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { resolveActorNationalId } from './resolve-actor'

const user = (nationalId: string, actorNationalId?: string): DMRUser =>
  ({
    nationalId,
    name: 'Test',
    fullName: 'Test',
    scope: [],
    client: 'test',
    authorization: 'Bearer test',
    ...(actorNationalId
      ? { actor: { nationalId: actorNationalId, name: 'Actor', scope: [] } }
      : {}),
  }) as DMRUser

describe('resolveActorNationalId', () => {
  it('prefers the delegation actor — the human who clicked', () => {
    // nationalId is the company being acted for; actor is the person.
    expect(resolveActorNationalId(user('5501012130', '0101901234'))).toBe(
      '0101901234',
    )
  })

  it('falls back to the subject when there is no delegation', () => {
    expect(resolveActorNationalId(user('5501012130'))).toBe('5501012130')
  })

  it('never returns the company when a person is named', () => {
    // The regression that matters: recording the company as the actor would
    // make every self-service issuance look unattributable.
    const resolved = resolveActorNationalId(user('5501012130', '0101901234'))

    expect(resolved).not.toBe('5501012130')
  })
})
