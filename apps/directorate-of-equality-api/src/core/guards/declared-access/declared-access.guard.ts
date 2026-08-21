import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { PUBLIC_ROUTE_METADATA } from '../../decorators/public-route.decorator'
import { AdminGuard } from '../admin/admin.guard'
import { CompanyResourceGuard } from '../company-resource/company-resource.guard'
import { ReportResourceGuard } from '../report-resource/report-resource.guard'

const LOGGING_CONTEXT = 'DeclaredAccessGuard'

/**
 * Nest's `@UseGuards` metadata key (`GUARDS_METADATA` in
 * `@nestjs/common/constants`, `'__guards__'` as of Nest 11). Inlined rather
 * than deep-imported, matching `swagger-coverage.spec.ts` — the same two-line
 * comment there explains why. If Nest ever changes the key, that spec's
 * default-deny assertions fail on every controller at once, so this cannot
 * degrade quietly into allowing everything.
 */
const GUARDS_METADATA = '__guards__'

/**
 * Guards that bind the request to a database row for the caller. One of these
 * is what turns an authenticated request into a known caller:
 *
 * - `AdminGuard` — active `doe_user` row, else `ForbiddenException`.
 * - `CompanyResourceGuard` — the caller's own `company` row by national ID,
 *   else 404. Under `@AutoProvisionCompany()` it resolves *or provisions* that
 *   row instead of throwing, which is deliberate for employer self-service:
 *   the row it creates is keyed to the caller's own national ID, so it still
 *   cannot reach another company's data.
 * - `ReportResourceGuard` — reviewer or owning company for the report, else
 *   `ForbiddenException`.
 *
 * Adding to this list widens what counts as secured across the whole API.
 * Nothing belongs here that can return `true` without tying the request to a
 * row the caller's own identity entitles them to.
 */
export const IDENTITY_GUARDS: ReadonlyArray<unknown> = [
  AdminGuard,
  CompanyResourceGuard,
  ReportResourceGuard,
]

/** `@UseGuards` accepts classes and instances; compare on the class either way. */
const guardType = (guard: unknown): unknown =>
  typeof guard === 'function' ? guard : guard?.constructor

/**
 * Whether a guard chain states who may call the route: a verified token plus a
 * caller resolved against the database.
 *
 * Exported so `swagger-coverage.spec.ts` asserts coverage with the identical
 * predicate the runtime enforces — a test that re-implemented this could pass
 * while the guard denies, or vice versa.
 */
export const declaresAccess = (guards: ReadonlyArray<unknown>): boolean => {
  const types = guards.map(guardType)

  return (
    types.includes(TokenJwtAuthGuard) &&
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
 * says who may call it. The declaration is the `@UseGuards` chain itself rather
 * than a separate marker, so there is one source of truth that cannot drift out
 * of step with what is actually enforced.
 *
 * The real check still happens in the declared guards, which run after this one.
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
    // refused, while the fix reaches whoever is running the app.
    this.logger.error(
      'Refused a route that declares no access policy. Add @UseGuards(TokenJwtAuthGuard, AdminGuard) for DoE staff, CompanyResourceGuard for applicants, or @PublicRoute(<reason>) if it is deliberately unauthenticated.',
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
   * would hide the class guards that actually run. Mirrors `guardsOn` in
   * `swagger-coverage.spec.ts`, narrowed to the one handler being called.
   */
  private effectiveGuards(context: ExecutionContext): Array<unknown> {
    const fromHandler: Array<unknown> =
      Reflect.getMetadata(GUARDS_METADATA, context.getHandler()) ?? []
    const fromClass: Array<unknown> =
      Reflect.getMetadata(GUARDS_METADATA, context.getClass()) ?? []

    return [...fromHandler, ...fromClass]
  }
}
