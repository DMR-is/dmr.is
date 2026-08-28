import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

/**
 * Which kennitala to record as having issued or revoked a key.
 *
 * Under island.is delegation the two claims mean different things:
 * `nationalId` is the subject being acted *for* — the company — while
 * `actor.nationalId` is the human who logged in and clicked. Audit wants the
 * human, so the actor claim wins where it exists.
 *
 * The fallback is not dead code: a company can authenticate as itself, with no
 * delegation and so no actor, in which case the company's own kennitala is the
 * most specific answer available. It matches `company_national_id` on the row,
 * which is how a reader can tell "logged in as the company" from "a named
 * person acted for the company" — the two are indistinguishable if the fallback
 * is recorded as null.
 */
export const resolveActorNationalId = (user: DMRUser): string =>
  user.actor?.nationalId ?? user.nationalId
