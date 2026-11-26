import type { Application } from '@dmr.is/shared-dto'

/** Who is calling: the token subject, and the involved parties they act for. */
export interface ApplicationCaller {
  /** The token subject: the applicant, or the party a delegate acts for. */
  nationalId?: string
  /** Ids of the involved parties the caller belongs to or acts for. */
  involvedPartyIds?: string[]
  /** True when the caller is signed in as an editorial admin. */
  isAdmin?: boolean
}

/** A national id with everything but its digits removed. */
export const normalizeNationalId = (value?: string): string =>
  (value ?? '').replace(/\D/g, '')

/**
 * Only the token subject counts, and it must be the applicant or an assignee.
 * island.is sets `applicant` from the token subject, and a delegate's token
 * carries the represented party as its subject, so a current delegate passes
 * on the subject alone. The actor and `applicantActors` are deliberately not
 * matched: they record who once acted for the applicant, and would keep a
 * delegate's access after the delegation ends.
 */
export const isApplicationParty = (
  application: Pick<Application, 'applicant' | 'assignees'>,
  caller: Pick<ApplicationCaller, 'nationalId'>,
): boolean => {
  const callerId = normalizeNationalId(caller.nationalId)
  if (!callerId) return false

  return [application.applicant, ...(application.assignees ?? [])]
    .map(normalizeNationalId)
    .includes(callerId)
}

/**
 * The involved-party ids on a request user. `RoleGuard` stores ids, the party
 * guard stores the party objects, and a user loaded from the DB carries
 * objects too, so compare by id whichever shape arrives.
 */
export const involvedPartyIdsOf = (
  involvedParties: ReadonlyArray<string | { id: string }> | undefined,
): string[] =>
  (involvedParties ?? []).map((party) =>
    typeof party === 'string' ? party : party.id,
  )
