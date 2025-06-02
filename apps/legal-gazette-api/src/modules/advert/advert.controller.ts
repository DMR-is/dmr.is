import { Controller, Get, Inject, Param } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { AdvertDto, GetAdvertsDto } from './dto/advert.dto'
import { IAdvertService } from './advert.service.interface'

@Controller({
  path: 'adverts',
  version: '1',
})
export class AdvertController {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
  ) {}

  @Get()
  @LGResponse({ operationId: 'getAdverts', type: GetAdvertsDto })
  getAdverts() {
    return this.advertService.getAdverts()
  }

  @Get('inprogress')
  @LGResponse({ operationId: 'getAdvertsToBePublished', type: GetAdvertsDto })
  getAdvertsToBePublished() {
    return this.advertService.getAdvertsToBePublished()
  }

  @Get(':id')
  @LGResponse({ operationId: 'getAdvertById', type: AdvertDto })
  getAdvertById(@Param('id') id: string) {
    return this.advertService.getAdvertById(id)
  }
}
