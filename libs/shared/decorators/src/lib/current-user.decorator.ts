import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * For admin users these guards are required to get the user
 * - Use `TokenJwtAuthGuard` and `RoleGuard` guards
 *
 * For application users
 * - Use `ApplicationAuthGuard` guard
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
