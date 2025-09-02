import { Controller, Inject, Param } from '@nestjs/common'
import { ApiParam } from '@nestjs/swagger'

import { Get } from '@dmr.is/decorators'
import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdvertVersionEnum } from '../advert.model'
import { IAdvertService } from '../advert.service.interface'

@Controller({
  path: 'adverts/:advertId/:version',
  version: '1',
})
export class AdvertPublicationsController {
  constructor(
    @Inject(IAdvertService)
    private readonly advertService: IAdvertService,
  ) {}

  @Get()
  @ApiParam({
    name: 'version',
    enum: AdvertVersionEnum,
  })
  async getPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @Param('version', new EnumValidationPipe(AdvertVersionEnum))
    version: AdvertVersionEnum,
  ) {
    return this.advertService.getAdvertPublication(advertId, version)
  }
}
