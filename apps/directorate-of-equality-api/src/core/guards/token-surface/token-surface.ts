import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { type Logger } from '@dmr.is/logging'

import { COMPANY_READ_TOKEN_SURFACE_METADATA } from '../../decorators/company-read-token-surface.decorator'
import { SELF_SERVICE_TOKEN_SURFACE_METADATA } from '../../decorators/self-service-token-surface.decorator'

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

/**
 * The island.is salary-report template's scope (`ApplicationScope.
 * directorateOfEqualitySalary` in island.is `libs/auth/scopes`). That template
 * requires this one instead of the scope above, so its tokens may carry only
 * this.
 */
export const ISLAND_IS_SALARY_APPLICATION_SCOPE =
  '@island.is/applications/directorate-of-equality-salary'

/**
 * island.is My Pages' dedicated DoE scope. My Pages is where a company manages
 * its API keys and partner delegations, an approved provider its vendor keys,
 * and where a company READS its reports. It never files or edits: it is in
 * `SELF_SERVICE_TOKEN_SCOPES` and `COMPANY_READ_TOKEN_SCOPES`, never in
 * `COMPANY_TOKEN_SCOPES`. It replaces partner-web, which never reached
 * production.
 *
 * The name is agreed with the island.is team, an ApiScope on the service-portal
 * client. Nothing else holds the string, so this is the one place to change if
 * it ever does.
 */
export const MY_PAGES_SCOPE = '@island.is/directorate-of-equality'

/**
 * Company routes that file, draft, edit, upload, withdraw or comment: the
 * island.is application system's two scopes only.
 *
 * The default for every company route (`CompanyResourceGuard`, and the company
 * side of `ReportResourceGuard`), so a new route accepts My Pages only once
 * someone marks it `@CompanyReadTokenSurface()` and pins it in
 * `swagger-coverage.spec.ts`.
 */
export const COMPANY_TOKEN_SCOPES: ReadonlyArray<string> = [
  ISLAND_IS_APPLICATION_SCOPE,
  ISLAND_IS_SALARY_APPLICATION_SCOPE,
]

/**
 * Company routes that only read the company's own reports (and the company
 * row itself), marked `@CompanyReadTokenSurface()`: the application system,
 * plus My Pages, which shows reports but must never change them.
 */
export const COMPANY_READ_TOKEN_SCOPES: ReadonlyArray<string> = [
  ...COMPANY_TOKEN_SCOPES,
  MY_PAGES_SCOPE,
]

/**
 * The self-service routes: a company's own partner API keys
 * (`application/api-keys`), its partner delegations and the provider list they
 * pick from (`application/partner-delegations`, `application/partner-providers`),
 * and an approved provider's own vendor keys (`application/partner-client/*`).
 * They are marked with `@SelfServiceTokenSurface()` (or sit behind
 * `PartnerClientResourceGuard`), and `swagger-coverage.spec.ts` pins which
 * routes those are.
 *
 * Narrower than `COMPANY_TOKEN_SCOPES` on purpose. Minting a key turns a token
 * that lasts minutes into access that lasts, so only the clients built to
 * manage keys may call these. That is island.is My Pages alone: the island.is
 * application system never calls them.
 */
export const SELF_SERVICE_TOKEN_SCOPES: ReadonlyArray<string> = [MY_PAGES_SCOPE]

/**
 * Which company scope list a handler declares: `@SelfServiceTokenSurface()`,
 * `@CompanyReadTokenSurface()`, or neither, which means
 * `COMPANY_TOKEN_SCOPES`. The one place the guards and
 * `swagger-coverage.spec.ts` resolve it, so the spec pins exactly what the
 * guards enforce.
 */
export const companyTokenScopesFor = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  handler: Function,
  // eslint-disable-next-line @typescript-eslint/ban-types
  controller: Function,
): ReadonlyArray<string> => {
  const declared = (key: string): boolean =>
    Boolean(
      (handler && Reflect.getMetadata(key, handler)) ??
        (controller && Reflect.getMetadata(key, controller)),
    )

  if (declared(SELF_SERVICE_TOKEN_SURFACE_METADATA)) {
    return SELF_SERVICE_TOKEN_SCOPES
  }

  if (declared(COMPANY_READ_TOKEN_SURFACE_METADATA)) {
    return COMPANY_READ_TOKEN_SCOPES
  }

  return COMPANY_TOKEN_SCOPES
}

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
 * A company acting through the island.is application system or My Pages: an
 * access token carrying
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
