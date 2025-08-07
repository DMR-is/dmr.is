import { Controller, Get, Inject } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { SubscriberDto } from './dto/subscriber.dto'
import { ISubscriberService } from './subscriber.service.interface'

@ApiBearerAuth()
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
