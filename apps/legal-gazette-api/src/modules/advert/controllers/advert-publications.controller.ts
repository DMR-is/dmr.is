import { Controller, Get, Inject, Param } from '@nestjs/common'
import { ApiParam } from '@nestjs/swagger'

import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { AdvertPublicationDetailedDto } from '../../advert-publications/dto/advert-publication.dto'
import { AdvertVersionEnum } from '../advert.model'
import { IAdvertService } from '../advert.service.interface'

@Controller({
  path: 'adverts/:advertId',
  version: '1',
})
export class AdvertPublicationsController {
  constructor(
    @Inject(IAdvertService)
    private readonly advertService: IAdvertService,
  ) {}

  @Get(':version')
  @ApiParam({
    name: 'version',
    enum: AdvertVersionEnum,
  })
  @LGResponse({
    operationId: 'getAdvertPublication',
    type: AdvertPublicationDetailedDto,
  })
  async getPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @Param('version', new EnumValidationPipe(AdvertVersionEnum))
    version: AdvertVersionEnum,
  ) {
    return this.advertService.getAdvertPublication(advertId, version)
  }
}
