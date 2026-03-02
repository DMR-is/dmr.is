import { Controller, Get, Inject, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { PublicWebScopes } from '../../core/guards/scope-guards/scopes.decorator'
import { SubscriberDto } from '../../models/subscriber.model'
import { MutationResponse } from '../../modules/shared/dto/mutation.dto'
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

  @Post('create-subscription')
  @LGResponse({
    operationId: 'createSubscription',
    type: MutationResponse,
  })
  createSubscription(@CurrentUser() user: DMRUser): Promise<MutationResponse> {
    return this.subscriberService.createSubscriptionForUser(user)
  }
}
