import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { PagingQuery } from '@dmr.is/shared/dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared/modules'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import {
  CreateSubscriberAdminDto,
  GetSubscribersWithPagingResponse,
  SubscriberDto,
  UpdateSubscriberEndDateDto,
} from '../../models/subscriber.model'
import { ISubscriberAdminService } from './subscriber-admin.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
@Controller({
  path: 'subscribers-admin',
  version: '1',
})
export class SubscriberAdminController {
  constructor(
    @Inject(ISubscriberAdminService)
    private readonly subscriberAdminService: ISubscriberAdminService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getSubscribersAdmin',
    type: GetSubscribersWithPagingResponse,
  })
  getSubscribers(
    @Query() query: PagingQuery,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<GetSubscribersWithPagingResponse> {
    return this.subscriberAdminService.getSubscribers(
      query,
      includeInactive === 'true',
    )
  }

  @Post()
  @LGResponse({ operationId: 'createSubscriberAdmin', type: SubscriberDto })
  createSubscriber(
    @Body() createSubscriberDto: CreateSubscriberAdminDto,
    @CurrentUser() user: DMRUser,
  ): Promise<SubscriberDto> {
    return this.subscriberAdminService.createSubscriber(
      createSubscriberDto,
      user,
    )
  }

  @Patch(':subscriberId/end-date')
  @LGResponse({ operationId: 'updateSubscriberEndDate', type: SubscriberDto })
  updateSubscriberEndDate(
    @Param('subscriberId') subscriberId: string,
    @Body() updateDto: UpdateSubscriberEndDateDto,
    @CurrentUser() user: DMRUser,
  ): Promise<SubscriberDto> {
    return this.subscriberAdminService.updateSubscriberEndDate(
      subscriberId,
      updateDto,
      user,
    )
  }

  @Post(':subscriberId/deactivate')
  @LGResponse({ operationId: 'deactivateSubscriberAdmin' })
  deactivateSubscriber(
    @Param('subscriberId') subscriberId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.subscriberAdminService.deactivateSubscriber(subscriberId, user)
  }

  @Post(':subscriberId/activate')
  @LGResponse({ operationId: 'activateSubscriberAdmin', type: SubscriberDto })
  activateSubscriber(
    @Param('subscriberId') subscriberId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<SubscriberDto> {
    return this.subscriberAdminService.activateSubscriber(subscriberId, user)
  }
}
