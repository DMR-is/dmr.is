import { Body, Controller, Inject, Param, Post } from '@nestjs/common'
import { ApiParam } from '@nestjs/swagger'

import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { IAdvertPublicationService } from '../../advert-publications/advert-publication.service.interface'
import { PublishAdvertsBody } from '../dto/advert.dto'

@Controller({
  path: 'adverts',
  version: '1',
})
export class AdvertPublishController {
  constructor(
    @Inject(IAdvertPublicationService)
    private readonly advertPublicationService: IAdvertPublicationService,
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
