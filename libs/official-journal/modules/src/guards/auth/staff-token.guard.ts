import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { getLogger } from '@dmr.is/logging'

const logger = getLogger('StaffTokenGuard')

/**
 * official-journal-web's IDS client id. The web sends its id_token, whose
 * `aud` is the client it was issued to, so a token issued to any other client
 * fails here.
 */
const STAFF_CLIENT_ID_VAR = 'OFFICIAL_JOURNAL_WEB_CLIENT_ID'

type TokenClaims = {
  aud?: unknown
  client_id?: unknown
  actor?: unknown
}

// IDS emits a multi-valued claim as an array but a single value as a string.
const claimValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return typeof value === 'string' ? value.split(' ').filter(Boolean) : []
}

/**
 * Staff routes: an id_token issued to official-journal-web, for the staff
 * member themselves.
 *
 * `TokenJwtAuthGuard` is shared with other products and checks only signature,
 * issuer and expiry, so a token IDS signed for any client reaches the guards
 * after it. This binds staff routes to the client that serves them.
 *
 * Delegated sessions are refused. Under delegation `nationalId` is the person
 * acted for and `actor` the one signed in, so accepting one would hand a staff
 * member's authority to anyone they delegated anything to.
 *
 * Place it after `TokenJwtAuthGuard` and before `RoleGuard`, which replaces
 * `req.user` with the DB user and drops the token claims.
 */
@Injectable()
export class StaffTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const staffClientId = process.env[STAFF_CLIENT_ID_VAR]

    if (!staffClientId) {
      logger.error(
        `Missing required environment variable: ${STAFF_CLIENT_ID_VAR}`,
      )
      // Logged, not returned: the exception's message reaches the caller.
      throw new InternalServerErrorException()
    }

    const claims: TokenClaims = context.switchToHttp().getRequest().user ?? {}

    if (!claimValues(claims.aud).includes(staffClientId)) {
      this.refuse(claims, 'not issued to official-journal-web')
    }

    if (claims.actor) {
      this.refuse(claims, 'delegated session on a staff route')
    }

    return true
  }

  private refuse(claims: TokenClaims, reason: string): never {
    // Claim names only, never the token. Neither value is a secret, and both
    // are what someone needs to see if a real client's token is shaped
    // differently than these rules expect.
    logger.warn(`Refused a token not issued for this surface: ${reason}`, {
      aud: claims.aud,
      clientId: claims.client_id,
    })

    throw new ForbiddenException('Token is not valid for this endpoint')
  }
}
