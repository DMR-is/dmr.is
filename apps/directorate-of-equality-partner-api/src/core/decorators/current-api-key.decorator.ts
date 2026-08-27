import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

import { ApiKeyContext } from '../../modules/api-key/api-key.types'

/**
 * The verified key behind the request. Only meaningful on routes guarded by
 * `ApiKeyGuard`; without it there is nothing on the request to return.
 */
export const CurrentApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiKeyContext => {
    const context = ctx.switchToHttp().getRequest()?.apiKeyContext

    if (!context) {
      throw new UnauthorizedException()
    }

    return context
  },
)
