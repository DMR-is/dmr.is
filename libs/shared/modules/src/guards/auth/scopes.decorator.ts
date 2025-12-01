import { SetMetadata } from '@nestjs/common'

export const SCOPES_KEY = 'scopes'
export const ACTOR_SCOPES_KEY = 'actor-scopes'

/**
 * Generic scope decorator for custom scope-based authorization.
 * Use this when you need to specify custom scopes for an endpoint.
 *
 * @example
 * ```typescript
 * @Scopes('@dmr.is/custom-scope')
 * @Get('endpoint')
 * async handler() { ... }
 * ```
 */
export const Scopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes)

/**
 * Decorator for actor-based scope authorization.
 * Used when delegated access requires specific actor scopes.
 */
export const ActorScopes = (...scopes: string[]) =>
  SetMetadata(ACTOR_SCOPES_KEY, scopes)

/**
 * Scope decorator for legal-gazette-public-web endpoints.
 * Requires the '@dmr.is/lg-public-web' scope.
 *
 * @example
 * ```typescript
 * @PublicWebScopes()
 * @Get('public-endpoint')
 * async handler() { ... }
 * ```
 */
export const PublicWebScopes = () =>
  SetMetadata(SCOPES_KEY, ['@dmr.is/lg-public-web'])

/**
 * Scope decorator for legal-gazette-application-web endpoints.
 * Requires the '@dmr.is/lg-application-web' scope.
 *
 * @example
 * ```typescript
 * @ApplicationWebScopes()
 * @Get('application-endpoint')
 * async handler() { ... }
 * ```
 */
export const ApplicationWebScopes = () =>
  SetMetadata(SCOPES_KEY, ['@dmr.is/lg-application-web'])

/**
 * Scope decorator for endpoints accessible by EITHER public-web OR application-web users.
 * User needs only ONE of the scopes to access the endpoint.
 *
 * @example
 * ```typescript
 * @PublicOrApplicationWebScopes()
 * @Get('shared-endpoint')
 * async handler() { ... }
 * ```
 */
export const PublicOrApplicationWebScopes = () =>
  SetMetadata(SCOPES_KEY, [
    '@dmr.is/lg-public-web',
    '@dmr.is/lg-application-web',
  ])

/**
 * Scope decorator for endpoints accessible by all three legal gazette web applications.
 * User needs only ONE of the scopes to access the endpoint.
 * Admin users access via AdminGuard, others via ScopesGuard.
 *
 * @example
 * ```typescript
 * @AllWebAppsScopes()
 * @UseGuards(TokenJwtAuthGuard, ScopesGuard, AdminGuard)
 * @Get('shared-endpoint')
 * async handler() { ... }
 * ```
 */
export const AllWebAppsScopes = () =>
  SetMetadata(SCOPES_KEY, [
    '@dmr.is/lg-public-web',
    '@dmr.is/lg-application-web',
  ])

/**
 * Scope decorator for endpoints accessible by admin AND application-web users.
 * Admin users pass via AdminGuard, application-web users pass via ScopesGuard.
 *
 * @example
 * ```typescript
 * @AdminOrApplicationWebScopes()
 * @UseGuards(TokenJwtAuthGuard, ScopesGuard, AdminGuard)
 * @Get('admin-or-app-endpoint')
 * async handler() { ... }
 * ```
 */
export const AdminOrApplicationWebScopes = () =>
  SetMetadata(SCOPES_KEY, ['@dmr.is/lg-application-web'])
