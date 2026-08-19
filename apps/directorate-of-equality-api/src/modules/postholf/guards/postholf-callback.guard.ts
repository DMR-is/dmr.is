import * as jwt from 'jsonwebtoken'
import jwksRsa, { JwksClient } from 'jwks-rsa'

import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

const LOGGING_CONTEXT = 'PostholfCallbackGuard'

/** Seconds of clock skew tolerated, matching `TokenJwtAuthGuard`. */
const CLOCK_TOLERANCE_SECONDS = 20

/**
 * Authenticates island.is calling our Skjalaveita endpoint.
 *
 * Deliberately **not** a parameterisation of `TokenJwtAuthGuard`
 * (`libs/shared/modules/src/lib/guards/auth/token-auth.guard.ts`). That guard
 * hardwires its issuer to `IDENTITY_SERVER_DOMAIN`, is shared by every app in the
 * repo, and validates signature and issuer only — no audience, no scope. The
 * Pósthólf security checklist requires signature, issuer, expiry, **audience and
 * scope**, so this is a separate guard rather than a widened shared one.
 *
 * ⚠️ PLUG IN — every value comes from env because none of it is knowable from
 * this repo, and in the X-Road topology it is not even settled whether island.is
 * signs the inbound token with island.is IDS or with Entra:
 *
 *   POSTHOLF_CALLBACK_JWKS_URI  full JWKS URL of whichever issuer signs it
 *   POSTHOLF_CALLBACK_ISSUER    expected `iss`
 *   POSTHOLF_CALLBACK_AUDIENCE  expected `aud`
 *   POSTHOLF_CALLBACK_SCOPE     scope that must be present
 *
 * All four are required. A missing one throws rather than degrading to a weaker
 * check — a half-configured guard on an endpoint that serves legal documents is
 * worse than a broken one, because it looks like it works.
 */
@Injectable()
export class PostholfCallbackGuard implements CanActivate {
  private client: JwksClient | null = null

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const authHeader: string | undefined = request.headers?.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is missing')
    }

    const token = authHeader.slice('Bearer '.length).trim()
    if (!token) {
      throw new UnauthorizedException('Bearer token is missing')
    }

    const issuer = this.requireEnv('POSTHOLF_CALLBACK_ISSUER')
    const audience = this.requireEnv('POSTHOLF_CALLBACK_AUDIENCE')
    const requiredScope = this.requireEnv('POSTHOLF_CALLBACK_SCOPE')

    // Resolved before the try block on purpose. Inside it, the
    // InternalServerErrorException for a missing POSTHOLF_CALLBACK_JWKS_URI would
    // be caught and re-thrown as "Invalid or expired token" — sending whoever
    // debugs it to island.is's token instead of our own configuration.
    const jwks = this.jwksClient()

    let payload: jwt.JwtPayload
    try {
      const header = jwt.decode(token, { complete: true })?.header
      if (!header?.kid) {
        throw new Error('Token header carries no key id')
      }

      const key = await jwks.getSigningKey(header.kid)

      payload = jwt.verify(token, key.getPublicKey(), {
        issuer,
        audience,
        algorithms: ['RS256'],
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      }) as jwt.JwtPayload
    } catch (error) {
      this.logger.warn('Rejected a Skjalaveita callback token', {
        context: LOGGING_CONTEXT,
        message: error instanceof Error ? error.message : String(error),
      })
      throw new UnauthorizedException('Invalid or expired token')
    }

    if (!this.hasScope(payload, requiredScope)) {
      this.logger.warn(
        'Skjalaveita callback token is missing the required scope',
        {
          context: LOGGING_CONTEXT,
          requiredScope,
        },
      )
      throw new UnauthorizedException('Token is missing the required scope')
    }

    return true
  }

  /**
   * Reads the scope claim in both shapes issuers use: `scope` as a
   * space-delimited string (OAuth 2 / island.is IDS) and `scp` as either an array
   * or a string (Entra). Which one applies here is unresolved, so both are
   * accepted rather than guessing.
   */
  private hasScope(payload: jwt.JwtPayload, required: string): boolean {
    const claims = [payload['scope'], payload['scp']]

    for (const claim of claims) {
      if (typeof claim === 'string' && claim.split(' ').includes(required)) {
        return true
      }
      if (Array.isArray(claim) && claim.includes(required)) {
        return true
      }
    }

    return false
  }

  /** Built lazily so an unconfigured environment fails on request, not at boot. */
  private jwksClient(): JwksClient {
    if (!this.client) {
      this.client = jwksRsa({
        jwksUri: this.requireEnv('POSTHOLF_CALLBACK_JWKS_URI'),
        cache: true,
        rateLimit: true,
      })
    }

    return this.client
  }

  private requireEnv(name: string): string {
    const value = process.env[name]
    if (!value) {
      this.logger.error(`Missing required environment variable: ${name}`, {
        context: LOGGING_CONTEXT,
      })
      throw new InternalServerErrorException(
        `Missing required environment variable: ${name}`,
      )
    }
    return value
  }
}
