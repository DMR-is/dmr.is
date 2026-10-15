import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'

import { audienceValues } from '../claim-values'

/**
 * Which IDS tokens the staff surface accepts.
 *
 * `TokenJwtAuthGuard` is shared with other products and checks only signature,
 * issuer and expiry, so a token IDS signed for any client reaches the guards
 * after it. Admin routes call `assertStaffToken` before they trust
 * `nationalId`.
 */

const logger = getLogger('TokenSurface')

/**
 * legal-gazette-web's IDS client id. legal-gazette-web sends its id_token,
 * whose `aud` is the client it was issued to, so a token issued to any other
 * client fails here.
 */
const STAFF_CLIENT_ID_VAR = 'LEGAL_GAZETTE_WEB_CLIENT_ID'

type TokenClaims = {
  aud?: unknown
  azp?: unknown
  client_id?: unknown
  actor?: unknown
}

const refuse = (
  claims: TokenClaims,
  reason: string,
  route: string | undefined,
): never => {
  // Client claims only, never the token. None of them is a secret, and they
  // are what someone needs to see if a real client's token is shaped
  // differently than these rules expect.
  logger.warn(`Refused a token not issued for this surface: ${reason}`, {
    route,
    aud: claims.aud,
    azp: claims.azp,
    clientId: claims.client_id,
  })

  // The same body as every other admin refusal, so a caller cannot tell which
  // check it failed; the reason is in the log above.
  throw new ForbiddenException('Admin access required')
}

/**
 * Legal Gazette staff signed in to legal-gazette-web: an id_token issued to
 * legal-gazette-web, for the staff member themselves.
 *
 * Delegated sessions are refused. Under delegation `nationalId` is the person
 * acted for and `actor` the one signed in, so accepting one would hand a staff
 * member's authority to anyone they delegated anything to.
 */
export const assertStaffToken = (user: unknown, route?: string): void => {
  // Trimmed: a stray newline in the stored value would otherwise refuse
  // every staff member.
  const staffClientId = process.env[STAFF_CLIENT_ID_VAR]?.trim()

  if (!staffClientId) {
    logger.error(
      `Missing required environment variable: ${STAFF_CLIENT_ID_VAR}`,
    )
    // Logged, not returned: the exception's message reaches the caller.
    throw new InternalServerErrorException()
  }

  const claims = (user ?? {}) as TokenClaims

  if (!audienceValues(claims.aud).includes(staffClientId)) {
    refuse(claims, 'not issued to legal-gazette-web', route)
  }

  // `aud` can list several clients; `azp` (id_token) and `client_id` (access
  // token) name the one the token was issued to. Checked when present, so the
  // binding does not rest on how IDS fills `aud`.
  for (const claim of ['azp', 'client_id'] as const) {
    if (claims[claim] !== undefined && claims[claim] !== staffClientId) {
      refuse(claims, `${claim} is not legal-gazette-web`, route)
    }
  }

  // Any `actor` at all, falsy or not: only a delegated session carries one.
  if (claims.actor !== undefined) {
    refuse(claims, 'delegated session on a staff route', route)
  }
}
