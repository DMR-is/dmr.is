import { Controller, Get, Inject, Param, Query } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { PagingQuery } from '@dmr.is/shared/dto'

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
  getAdverts(@Query() query: PagingQuery) {
    return this.advertService.getAdverts(query)
  }

  @Get('inprogress')
  @LGResponse({ operationId: 'getAdvertsToBePublished', type: GetAdvertsDto })
  getAdvertsToBePublished(@Query() query: PagingQuery) {
    return this.advertService.getAdvertsToBePublished(query)
  }

  @Get(':id')
  @LGResponse({ operationId: 'getAdvertById', type: AdvertDto })
  getAdvertById(@Param('id') id: string) {
    return this.advertService.getAdvertById(id)
  }
}
