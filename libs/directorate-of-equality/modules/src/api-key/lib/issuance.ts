import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common'

import {
  ApiKeyOriginEnum,
  ApiKeyScopeEnum,
  DEFAULT_API_KEY_SCOPES,
} from '@dmr.is/doe-shared'
import { Logger } from '@dmr.is/logging'

/**
 * The rules every credential is issued under, whichever table it lands in.
 *
 * Company keys (`doe_api_key`) and vendor client keys (`doe_partner_client_key`)
 * are minted by two services, and the partner API verifies both the same way.
 * Two copies of these rules would drift, and a drift here is a credential one
 * path refuses and the other accepts — so both services call these instead.
 */

/**
 * Environment segment baked into every issued key (`doe_<env>_...`).
 *
 * ⚠️ A DIAGNOSTIC, not a control. Nothing compares it on the verifying side and
 * it sits outside the HMAC, so a caller can edit it freely and the key still
 * verifies. It exists so a human reading a key, a log line or a support ticket
 * can tell which environment minted it.
 *
 * Reuses `API_ENV`, which both DoE app schemas declare, and falls back to `dev`
 * for local runs where the variable is optional.
 */
const API_KEY_ENV_VAR = 'API_ENV'
const DEFAULT_API_KEY_ENV = 'dev'

/** Server-side HMAC key. Absent means the API cannot issue or verify at all. */
const API_KEY_HMAC_SECRET_VAR = 'DOE_API_KEY_HMAC_SECRET'

/**
 * Ceiling on usable keys per owner — per company, or per vendor client.
 * Generous enough that rotation and a second integrator are never blocked, low
 * enough that a runaway loop stops.
 */
export const MAX_LIVE_KEYS_PER_OWNER = 10

export const apiKeyEnv = (): string =>
  process.env[API_KEY_ENV_VAR] || DEFAULT_API_KEY_ENV

/**
 * The server-side pepper mixed into every key digest. Rotating it invalidates
 * every issued key of either kind.
 */
export const readApiKeyPepper = (logger: Logger, context: string): string => {
  const secret = process.env[API_KEY_HMAC_SECRET_VAR]

  if (!secret) {
    logger.error(
      `Missing required environment variable: ${API_KEY_HMAC_SECRET_VAR}`,
      { context },
    )
    // Logged, not returned. HttpExceptionFilter genericises `message` but
    // copies the exception's own message into `details`, which IS sent — so
    // naming the variable here publishes a piece of our deployment
    // configuration to whoever provoked the 500.
    throw new InternalServerErrorException()
  }

  return secret
}

/**
 * `scopes` is a text[] rather than an enum array, so the database will accept
 * any string. Validate here so an unrecognised scope cannot be stored and then
 * silently fail every scope check at request time.
 *
 * Only an omitted set means the default — which is every scope. `[]` is
 * refused rather than read as "omitted": a caller sending it to mean "as
 * little as possible" would otherwise be handed everything, the cascading
 * starfsmat delete included.
 */
export const resolveApiKeyScopes = (
  scopes?: ApiKeyScopeEnum[],
): ApiKeyScopeEnum[] => {
  if (scopes === undefined) {
    return [...DEFAULT_API_KEY_SCOPES]
  }

  if (scopes.length === 0) {
    throw new BadRequestException(
      'An empty scope set is not allowed. Omit scopes for the default.',
    )
  }

  const known = new Set<string>(Object.values(ApiKeyScopeEnum))
  const unknown = scopes.filter((scope) => !known.has(scope))

  if (unknown.length > 0) {
    throw new BadRequestException(
      `Unknown API key scopes: ${unknown.join(', ')}`,
    )
  }

  return [...new Set(scopes)]
}

/**
 * Rejects an expiry that is already past.
 *
 * Without this the caller gets 201 and a plaintext secret that no verifier will
 * ever accept — the worst possible answer, because it looks like success and
 * the failure only appears when the integrator tries to use it. Null stays
 * meaningful: no expiry is a documented choice.
 */
export const resolveApiKeyExpiry = (expiresAt?: Date | null): Date | null => {
  if (!expiresAt) {
    return null
  }

  if (expiresAt.getTime() <= Date.now()) {
    throw new BadRequestException(
      'expiresAt must be in the future — a key that has already expired cannot be used',
    )
  }

  return expiresAt
}

/**
 * Which actor column to populate, derived from the issuance path rather than
 * taken on trust. The `*_created_actor_chk` constraints enforce the same pairing
 * in the database; failing here first turns what would be a 500 from a
 * constraint violation into a clear 400.
 */
export const resolveApiKeyIssuer = (input: {
  createdVia: ApiKeyOriginEnum
  actorUserId?: string | null
  actorNationalId?: string | null
}): { actorUserId: string | null; actorNationalId: string | null } => {
  if (input.createdVia === ApiKeyOriginEnum.ADMIN) {
    if (!input.actorUserId) {
      throw new BadRequestException(
        'An admin-issued API key must record the issuing reviewer',
      )
    }

    return { actorUserId: input.actorUserId, actorNationalId: null }
  }

  if (!input.actorNationalId) {
    throw new BadRequestException(
      'A self-service API key must record the issuing national ID',
    )
  }

  return { actorUserId: null, actorNationalId: input.actorNationalId }
}
