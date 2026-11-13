import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { resolveActorName, resolveActorNationalId } from './resolve-actor'

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

describe('resolveActorName', () => {
  it('names the delegation actor under procuration', () => {
    const procuration = user('5501012130', '0101901234')

    expect(resolveActorName(procuration)).toBe('Actor')
    // Same branch as the kennitala: the name belongs to the recorded person.
    expect(resolveActorNationalId(procuration)).toBe('0101901234')
  })

  it('names the subject on a self-login, with no actor', () => {
    const selfLogin = user('5501012130')

    expect(resolveActorName(selfLogin)).toBe('Test')
    expect(resolveActorNationalId(selfLogin)).toBe('5501012130')
  })

  it('records null rather than the company when the actor has no name', () => {
    const nameless = {
      ...user('5501012130', '0101901234'),
      actor: { nationalId: '0101901234', name: '', scope: [] },
    } as DMRUser

    expect(resolveActorName(nameless)).toBeNull()
  })
})
