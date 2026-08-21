import { SetMetadata } from '@nestjs/common'

export const PUBLIC_ROUTE_METADATA = 'doePublicRoute'

/**
 * Opts a controller (or a single handler) out of `DeclaredAccessGuard`, the
 * global default-deny guard. Everything else in this API must declare an
 * access policy through its `@UseGuards` chain; this is the only escape hatch.
 *
 * `reason` is mandatory and greppable — an endpoint cannot become reachable
 * without authentication unless someone writes down why. Anything marked here
 * is served to unauthenticated callers, so the reason has to justify that, not
 * merely describe the endpoint.
 *
 * Additions are pinned by `swagger-coverage.spec.ts`, which fails on any
 * controller carrying this decorator that is not in its allowlist.
 *
 * Note: deliberately not annotated `MethodDecorator` (unlike
 * `auto-provision-company.decorator.ts`) — that annotation would reject the
 * class-level use that is the common case here.
 */
export const PublicRoute = (reason: string) =>
  SetMetadata(PUBLIC_ROUTE_METADATA, reason)
