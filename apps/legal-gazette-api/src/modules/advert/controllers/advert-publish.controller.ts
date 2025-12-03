import {
  Body,
  Controller,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { PublishAdvertsBody } from '../../../models/advert.model'
import { IPublicationService } from '../publications/publication.service.interface'

@Controller({
  path: 'adverts',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class AdvertPublishController {
  constructor(
    @Inject(IPublicationService)
    private readonly advertPublicationService: IPublicationService,
  ) {}

  @Post('publish')
  @LGResponse({ operationId: 'publishAdverts' })
  async publishAdverts(@Body() body: PublishAdvertsBody) {
    return await this.advertPublicationService.publishAdverts(body.advertIds)
  }

  @Post(':id/publish')
  @ApiParam({ name: 'id', type: String })
  @LGResponse({ operationId: 'publishAdvert' })
  async publishAdvert(@Param('id', new UUIDValidationPipe()) id: string) {
    return await this.advertPublicationService.publishAdverts([id])
  }
}
