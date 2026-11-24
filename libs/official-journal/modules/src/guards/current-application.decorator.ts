import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import type { Application } from '@dmr.is/shared-dto'

/** Where `ApplicationOwnershipGuard` leaves the application on the request. */
export const APPLICATION_REQUEST_KEY = 'application'

/**
 * The application `ApplicationOwnershipGuard` fetched and authorised for the
 * route's `:id`. Handlers use this copy instead of reading the application a
 * second time, so the application acted on is the one the caller was checked
 * against. Only valid on routes guarded by `ApplicationOwnershipGuard`.
 */
export const CurrentApplication = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Application => {
    const application = ctx.switchToHttp().getRequest()[APPLICATION_REQUEST_KEY]

    if (!application) {
      throw new Error(
        'CurrentApplication requires ApplicationOwnershipGuard on the route',
      )
    }

    return application
  },
)
