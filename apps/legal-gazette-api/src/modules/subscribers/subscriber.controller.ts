import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { SubscriberDto } from '../../models/subscriber.model'
import { ISubscriberService } from './subscriber.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
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
  getMySubscriber(@CurrentUser() user: SubscriberDto) {
    return this.subscriberService.getUserByNationalId(user.nationalId)
  }
}
