/**
 * Deliberately free of next-auth and jose imports so it can be unit tested:
 * importing authOptions pulls in ESM that jest cannot parse.
 */

// The id token's `actor` claim only appears under a procuration (company)
// login: it is the human who is acting for the company, distinct from the
// token's own `nationalId`, which is the company being acted for. See
// libs/directorate-of-equality/modules/src/api-key/lib/resolve-actor.ts on
// the API side for the same distinction.
export interface IdTokenActor {
  nationalId: string
  name: string
  scope: Array<string>
}

export interface DecodedIdToken {
  nationalId?: string
  actor?: IdTokenActor
  subjectType?: string
}

/**
 * Who is allowed in.
 *
 * The id token's `subjectType` names what the `nationalId` claim refers to:
 * `legalEntity` when the session acts for a company, `person` when someone
 * signed in as themselves. Both carry a `nationalId`, so presence alone
 * decides nothing -- an individual's own kennitala satisfies it.
 *
 * Refusing on a missing `actor` instead would be wrong: a company can
 * authenticate as itself, with no delegation and therefore no actor, and the
 * issuance path is written to expect exactly that (see resolve-actor.ts in
 * @dmr.is/doe-modules).
 *
 * This matters downstream, not here: CompanyResourceGuard resolves -- and on
 * annotated routes provisions -- a company from `user.nationalId` with no
 * person-vs-company check of its own, so a personal kennitala reaching it
 * would mint a company.
 */
const LEGAL_ENTITY_SUBJECT_TYPE = 'legalEntity'

export const isCompanySubject = (token: DecodedIdToken): boolean =>
  token.subjectType === LEGAL_ENTITY_SUBJECT_TYPE && !!token.nationalId
