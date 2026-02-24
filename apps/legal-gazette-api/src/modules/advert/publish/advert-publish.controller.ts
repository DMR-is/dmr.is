import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess, LGResponse } from '../../../core/decorators'
import { AdvertPublishBulkDto } from '../../../core/dto/advert-publish.dto'
import {
  AuthorizationGuard,
  CanPublishBulkGuard,
  CanPublishGuard,
} from '../../../core/guards'
import { IAdvertPublishService } from './advert-publish.service.interface'

@Controller({
  path: 'advert-publications',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class AdvertPublishController {
  constructor(
    @Inject(IAdvertPublishService)
    private readonly advertPublishService: IAdvertPublishService,
  ) {}

  @Post('/publish-next')
  @UseGuards(CanPublishBulkGuard)
  @LGResponse({ operationId: 'publishNextBulk' })
  async publishNextBulk(
    @Body() body: AdvertPublishBulkDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.advertPublishService.publishNextPublications(
      body.advertIds,
      user,
    )
  }

  @Post('/publish-next/:advertId')
  @UseGuards(CanPublishGuard)
  @LGResponse({ operationId: 'publishNext' })
  async publishNext(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @CurrentUser() user: DMRUser,
  ) {
    return this.advertPublishService.publishNextPublication(advertId, user)
  }
}
