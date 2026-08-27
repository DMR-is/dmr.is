import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { PUBLIC_ROUTE_METADATA } from '../../decorators/public-route.decorator'
import { ApiKeyGuard } from '../api-key/api-key.guard'
import { PartnerCompanyGuard } from '../partner-company/partner-company.guard'

const LOGGING_CONTEXT = 'DeclaredAccessGuard'

/**
 * Nest's `@UseGuards` metadata key (`GUARDS_METADATA` in
 * `@nestjs/common/constants`, `'__guards__'` as of Nest 10). Inlined rather than
 * deep-imported, matching the sibling app. If Nest changes the key,
 * `partner-coverage.spec.ts` fails on every controller at once, so this cannot
 * degrade quietly into allowing everything.
 */
const GUARDS_METADATA = '__guards__'

/**
 * The guard that authenticates a caller on this surface. Unlike the sibling app
 * there is exactly one: an API key is the only credential this API accepts.
 */
export const AUTHENTICATION_GUARD: unknown = ApiKeyGuard

/**
 * The guard that binds a request to the company it may act for.
 *
 * `PartnerCompanyGuard` resolves `doe_api_key.company_national_id` to a company
 * row and throws when there is none. It deliberately does not auto-provision, so
 * it cannot invent a tenant.
 *
 * Adding to this list widens what counts as secured across the whole API.
 * Nothing belongs here that can return `true` without tying the request to a
 * company the presented key is entitled to.
 */
export const IDENTITY_GUARDS: ReadonlyArray<unknown> = [PartnerCompanyGuard]

/** `@UseGuards` accepts classes and instances; compare on the class either way. */
const guardType = (guard: unknown): unknown =>
  typeof guard === 'function' ? guard : guard?.constructor

/**
 * Whether a guard chain states who may call the route: a verified credential
 * plus a company resolved against the database.
 *
 * Exported so the coverage spec asserts with the identical predicate the runtime
 * enforces — a spec that re-implemented this could pass while the guard denies,
 * or the reverse.
 */
export const declaresAccess = (guards: ReadonlyArray<unknown>): boolean => {
  const types = guards.map(guardType)

  return (
    types.includes(AUTHENTICATION_GUARD) &&
    types.some((type) => IDENTITY_GUARDS.includes(type))
  )
}

/**
 * Default-deny for the whole API. Registered once as `APP_GUARD`, so it runs
 * before any controller or route guard on every request.
 *
 * It authorizes nothing itself and never touches the database. Its only job is
 * to refuse routes whose access policy is unstated, which makes authorization
 * opt-out instead of opt-in: a new controller is unreachable until its author
 * says who may call it.
 *
 * This matters more here than on the sibling app. There, an undeclared route is
 * exposed to X-Road and the internal network. Here it is exposed to the
 * internet, and every route on it can write to the register.
 */
@Injectable()
export class DeclaredAccessGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const publicReason = this.reflector.getAllAndOverride<string>(
      PUBLIC_ROUTE_METADATA,
      [context.getHandler(), context.getClass()],
    )

    if (publicReason) {
      return true
    }

    if (declaresAccess(this.effectiveGuards(context))) {
      return true
    }

    // Logged rather than returned: the response says only that the route is
    // refused, while the fix reaches whoever is running the app. Returning it
    // would publish the guard architecture of a public surface.
    this.logger.error(
      'Refused a route that declares no access policy. Add @UseGuards(ApiKeyGuard, PartnerCompanyGuard) — plus @RequireApiScope — or @PublicRoute(<reason>) if it is deliberately unauthenticated.',
      {
        context: LOGGING_CONTEXT,
        controller: context.getClass().name,
        handler: context.getHandler().name,
      },
    )

    throw new ForbiddenException('This endpoint declares no access policy')
  }

  /**
   * Class-level and handler-level `@UseGuards`, unioned.
   *
   * `Reflector.getAllAndOverride` is wrong here: a handler-level `@UseGuards`
   * adds to the class chain at runtime rather than replacing it, so overriding
   * would hide the class guards that actually run.
   */
  private effectiveGuards(context: ExecutionContext): Array<unknown> {
    const fromHandler: Array<unknown> =
      Reflect.getMetadata(GUARDS_METADATA, context.getHandler()) ?? []
    const fromClass: Array<unknown> =
      Reflect.getMetadata(GUARDS_METADATA, context.getClass()) ?? []

    return [...fromHandler, ...fromClass]
  }
}
