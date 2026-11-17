import { ForbiddenException, type Type } from '@nestjs/common'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CompanyResourceGuard } from '../company-resource/company-resource.guard'
import { PartnerClientResourceGuard } from '../partner-client-resource/partner-client-resource.guard'
import {
  ISLAND_IS_APPLICATION_SCOPE,
  ISLAND_IS_SALARY_APPLICATION_SCOPE,
  MY_PAGES_SCOPE,
} from './token-surface'

/**
 * For the applicant controller specs: proves a controller's routes sit behind
 * an identity guard that runs the token-surface check, by driving the guard
 * the controller itself declares rather than one built by hand.
 *
 * Plain TypeScript with no jest globals, because the app's tsconfig compiles
 * this file too; each check throws on failure and the spec wraps it in `it`.
 */

// Nest's `@UseGuards` metadata key, as declared-access.guard.ts reads it.
const GUARDS_METADATA = '__guards__'

const NATIONAL_ID = '5501234567'

/**
 * partner-web's scope, retired when My Pages took over self-service. Held here
 * as a literal because the guards no longer name it: every route must refuse it.
 */
export const RETIRED_PARTNER_WEB_SCOPE = '@jafnretti.is/doe-partner-web'

const silentLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
}

type IdentityGuard =
  | typeof CompanyResourceGuard
  | typeof PartnerClientResourceGuard

/** The guard chain a handler runs: class-level, then any method-level. */
export const guardChainOf = (
  controller: Type<unknown>,
  method: string,
): unknown[] => {
  const handler = (controller.prototype as Record<string, unknown>)[method]

  if (typeof handler !== 'function') {
    throw new Error(`${controller.name} has no handler ${method}`)
  }

  return [
    ...(Reflect.getMetadata(GUARDS_METADATA, controller) ?? []),
    ...(Reflect.getMetadata(GUARDS_METADATA, handler) ?? []),
  ]
}

const buildGuard = (expected: IdentityGuard) =>
  expected === PartnerClientResourceGuard
    ? new PartnerClientResourceGuard(
        silentLogger as never,
        {
          findLiveByNationalId: async () => ({
            id: 'client-1',
            revokedAt: null,
          }),
        } as never,
      )
    : new CompanyResourceGuard(
        silentLogger as never,
        {
          getByNationalId: async () => ({ id: 'company-1' }),
          getOrCreateByNationalId: async () => ({ id: 'company-1' }),
        } as never,
        { getAllAndOverride: () => false } as never,
      )

/**
 * The route's real handler and class go on the context, because the guard
 * reads the route's declared surface (`@CompanyReadTokenSurface()`,
 * `@SelfServiceTokenSurface()` or neither) from them.
 */
const contextFor = (
  controller: Type<unknown>,
  method: string,
  user: Record<string, unknown>,
) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => (controller.prototype as Record<string, unknown>)[method],
    getClass: () => controller,
  }) as never

/** Throws unless `method` runs `TokenJwtAuthGuard` first and then `expected`. */
export const assertIdentityGuarded = (
  controller: Type<unknown>,
  method: string,
  expected: IdentityGuard,
): void => {
  const chain = guardChainOf(controller, method)

  if (chain[0] !== TokenJwtAuthGuard || !chain.includes(expected)) {
    throw new Error(
      `${controller.name}.${method} is not behind TokenJwtAuthGuard + ${expected.name}`,
    )
  }
}

/**
 * Throws unless `method`'s identity guard admits every scope in `accepts`, and
 * refuses with 403 a token for an unrelated client, an id_token (no scope),
 * partner-web's retired scope and every scope in `refuses`.
 */
export const assertTokenSurface = async (
  controller: Type<unknown>,
  method: string,
  expected: IdentityGuard,
  { accepts, refuses = [] }: { accepts: string[]; refuses?: string[] },
): Promise<void> => {
  const guard = buildGuard(expected)
  const route = `${controller.name}.${method}`

  for (const scope of accepts) {
    const admitted = await guard.canActivate(
      contextFor(controller, method, {
        nationalId: NATIONAL_ID,
        scope: [scope],
      }),
    )
    if (admitted !== true) {
      throw new Error(`${route} refused its own scope ${scope}`)
    }
  }

  const foreign: Array<Record<string, unknown>> = [
    { nationalId: NATIONAL_ID, scope: ['@island.is/documents'] },
    { nationalId: NATIONAL_ID, aud: 'doe-web-client' },
    { nationalId: NATIONAL_ID, scope: [RETIRED_PARTNER_WEB_SCOPE] },
    ...refuses.map((scope) => ({ nationalId: NATIONAL_ID, scope: [scope] })),
  ]

  for (const user of foreign) {
    const refused = await guard
      .canActivate(contextFor(controller, method, user))
      .then(
        () => false,
        (error) => error instanceof ForbiddenException,
      )
    if (!refused) {
      throw new Error(
        `${route} did not refuse ${JSON.stringify(user.scope ?? user.aud)} with 403`,
      )
    }
  }
}

export {
  ISLAND_IS_APPLICATION_SCOPE,
  ISLAND_IS_SALARY_APPLICATION_SCOPE,
  MY_PAGES_SCOPE,
}
