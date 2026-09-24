import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'

import { PartnerClientDto } from '@dmr.is/doe-modules/partner-client'

import { PartnerClientResourceRequest } from '../guards/partner-client-resource/partner-client-resource.guard'

/**
 * The provider the signed-in organisation is, as resolved by
 * `PartnerClientResourceGuard`. Throws rather than returning undefined so a
 * handler cannot run without one.
 */
export const CurrentPartnerClient = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PartnerClientDto => {
    const client = ctx
      .switchToHttp()
      .getRequest<PartnerClientResourceRequest>()?.partnerClientContext

    if (!client) {
      throw new UnauthorizedException()
    }

    return client
  },
)
