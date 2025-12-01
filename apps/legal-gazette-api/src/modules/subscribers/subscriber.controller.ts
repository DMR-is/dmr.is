import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { PublicWebScopes, TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { SubscriberDto } from '../../models/subscriber.model'
import { ISubscriberService } from './subscriber.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@PublicWebScopes()
@Controller({
  path: 'subscribers',
  version: '1',
})
export class SubscriberController {
  constructor(
    @Inject(ISubscriberService)
    private readonly subscriberService: ISubscriberService,
  ) {}

  @Get('me')
  @LGResponse({
    operationId: 'getMySubscriber',
    type: SubscriberDto,
  })
  getMySubscriber(@CurrentUser() user: DMRUser): Promise<SubscriberDto> {
    return this.subscriberService.getUserByNationalId(user)
  }
}
