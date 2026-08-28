import { SetMetadata } from '@nestjs/common'

export const PUBLIC_ROUTE_METADATA = 'doePartnerPublicRoute'

/**
 * Opts a controller or handler out of `DeclaredAccessGuard`, the global
 * default-deny guard. Everything else on this API must declare an access policy
 * through its `@UseGuards` chain; this is the only escape hatch.
 *
 * `reason` is mandatory and greppable — an endpoint cannot become reachable
 * without authentication unless someone writes down why. On this surface that
 * bar is higher than on the sibling app: anything marked here is served to the
 * open internet, not to X-Road, so the reason has to justify *that* rather than
 * merely describe the endpoint.
 *
 * Additions are pinned by `partner-coverage.spec.ts`, which fails on any
 * controller carrying this decorator that is not in its allowlist.
 */
export const PublicRoute = (reason: string) =>
  SetMetadata(PUBLIC_ROUTE_METADATA, reason)
