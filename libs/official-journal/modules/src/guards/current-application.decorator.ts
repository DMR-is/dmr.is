import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import type { Application } from '@dmr.is/shared-dto'

/**
 * The application `ApplicationOwnershipGuard` fetched and authorised for the
 * route's `:id`. Handlers use this copy instead of reading the application a
 * second time, so the application acted on is the one the caller was checked
 * against. Only valid on routes guarded by `ApplicationOwnershipGuard`.
 */
export const CurrentApplication = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Application => {
    const application = ctx.switchToHttp().getRequest().application

    if (!application) {
      throw new Error(
        'CurrentApplication requires ApplicationOwnershipGuard on the route',
      )
    }

    return application
  },
)
