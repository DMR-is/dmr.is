import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'

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
  client_id?: unknown
  actor?: unknown
}

// IDS emits a multi-valued claim as an array but a single value as a string.
export const claimValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return typeof value === 'string' ? value.split(' ').filter(Boolean) : []
}

/**
 * A token refused here, already logged with the reason. Distinct from the
 * plain 403 a missing admin row gives, so a caller does not log it again as
 * one.
 */
export class TokenSurfaceRefusedException extends ForbiddenException {
  constructor() {
    super('Token is not valid for this endpoint')
  }
}

const refuse = (claims: TokenClaims, reason: string): never => {
  // Claim names only, never the token. Neither value is a secret, and both
  // are what someone needs to see if a real client's token is shaped
  // differently than these rules expect.
  logger.warn(`Refused a token not issued for this surface: ${reason}`, {
    aud: claims.aud,
    clientId: claims.client_id,
  })

  throw new TokenSurfaceRefusedException()
}

/**
 * Legal Gazette staff signed in to legal-gazette-web: an id_token issued to
 * legal-gazette-web, for the staff member themselves.
 *
 * Delegated sessions are refused. Under delegation `nationalId` is the person
 * acted for and `actor` the one signed in, so accepting one would hand a staff
 * member's authority to anyone they delegated anything to.
 */
export const assertStaffToken = (user: unknown): void => {
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

  if (!claimValues(claims.aud).includes(staffClientId)) {
    refuse(claims, 'not issued to legal-gazette-web')
  }

  if (claims.actor) {
    refuse(claims, 'delegated session on a staff route')
  }
}
