import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUserRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest()
      return request.user.role
    } catch (error) {
      return null
    }
  },
)
