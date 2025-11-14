import { Body, Controller, Inject, Param, Post } from '@nestjs/common'
import { ApiParam } from '@nestjs/swagger'

import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { PublishAdvertsBody } from '../../../models/advert.model'
import { IPublicationService } from '../publications/publication.service.interface'

@Controller({
  path: 'adverts',
  version: '1',
})
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
