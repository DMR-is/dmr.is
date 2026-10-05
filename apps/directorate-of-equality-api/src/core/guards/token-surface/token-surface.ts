import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger } from '@dmr.is/logging'

/**
 * Which IDS tokens each caller surface accepts.
 *
 * `TokenJwtAuthGuard` is shared with other products and checks only signature
 * and issuer, so a token IDS signed for any client, under any delegation scope,
 * reaches the identity guards. Those guards call these checks before they
 * trust `nationalId`, which binds each surface to the client that serves it.
 */

/**
 * The island.is application system. The DoE templates require this scope, and
 * the island.is client (`scope: []`) passes the user's own token through
 * without an exchange, so it is on every token that channel sends.
 */
export const ISLAND_IS_APPLICATION_SCOPE =
  '@island.is/applications/directorate-of-equality'

/** partner-web's API resource scope, as its `identityServerConfig` requests it. */
export const PARTNER_WEB_SCOPE = '@jafnretti.is/doe-partner-web'

/** Both company channels call the same `/application` endpoints. */
export const COMPANY_TOKEN_SCOPES: ReadonlyArray<string> = [
  ISLAND_IS_APPLICATION_SCOPE,
  PARTNER_WEB_SCOPE,
]

/**
 * doe-web's IDS client id. doe-web sends its id_token, whose `aud` is the
 * client it was issued to, so a token issued to any other client fails here.
 */
const STAFF_CLIENT_ID_VAR = 'DOE_WEB_CLIENT_ID'

type TokenClaims = DMRUser & {
  aud?: unknown
  client_id?: unknown
}

// IDS emits a multi-valued claim as an array but a single value as a string.
const claimValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return typeof value === 'string' ? value.split(' ').filter(Boolean) : []
}

const refuse = (
  user: TokenClaims,
  logger: Logger,
  context: string,
  reason: string,
): never => {
  // Claim names only, never the token. Neither value is a secret, and both
  // are what someone needs to see if a real client's token is shaped
  // differently than these rules expect.
  logger.warn(`Refused a token not issued for this surface: ${reason}`, {
    context,
    aud: user.aud,
    clientId: user.client_id,
  })

  throw new ForbiddenException('Token is not valid for this endpoint')
}

/**
 * A company acting through island.is or partner-web: an access token carrying
 * one of `allowedScopes`. An id_token has no `scope` claim, so it fails too.
 *
 * Delegation is allowed here, since that is how a person acts for a company.
 * IDS drops a scope the delegation does not grant, so its presence is also
 * proof that the delegation covers DoE.
 */
export const assertCompanyToken = (
  user: DMRUser,
  logger: Logger,
  context: string,
  allowedScopes: ReadonlyArray<string> = COMPANY_TOKEN_SCOPES,
): void => {
  const scopes = claimValues(user.scope)

  if (!allowedScopes.some((scope) => scopes.includes(scope))) {
    refuse(user, logger, context, 'missing company scope')
  }
}

/**
 * DoE staff signed in to doe-web: an id_token issued to doe-web, for the
 * reviewer themselves.
 *
 * Delegated sessions are refused. Under delegation `nationalId` is the person
 * acted for and `actor` the one signed in, so accepting one would hand a
 * reviewer's authority to anyone they delegated anything to.
 */
export const assertStaffToken = (
  user: DMRUser,
  logger: Logger,
  context: string,
): void => {
  const staffClientId = process.env[STAFF_CLIENT_ID_VAR]

  if (!staffClientId) {
    logger.error(
      `Missing required environment variable: ${STAFF_CLIENT_ID_VAR}`,
      { context },
    )
    // Logged, not returned: the exception's message reaches the caller.
    throw new InternalServerErrorException()
  }

  const claims = user as TokenClaims

  if (!claimValues(claims.aud).includes(staffClientId)) {
    refuse(claims, logger, context, 'not issued to doe-web')
  }

  if (claims.actor) {
    refuse(claims, logger, context, 'delegated session on a staff route')
  }
}
