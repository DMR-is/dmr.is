import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { PagingQuery } from '@dmr.is/shared/dto'

import { IAdvertService } from '../advert.service.interface'
import {
  AdvertDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  UpdateAdvertDto,
} from '../dto/advert.dto'

@Controller({
  path: 'adverts',
  version: '1',
})
export class AdvertController {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
  ) {}

  @Get('count')
  @LGResponse({
    operationId: 'getAdvertsCount',
    type: GetAdvertsStatusCounterDto,
  })
  getAdvertsCount() {
    return this.advertService.getAdvertsCount()
  }

  @Get('inprogress')
  @LGResponse({ operationId: 'getAdvertsInProgress', type: GetAdvertsDto })
  getAdvertsInProgress(@Query() query: GetAdvertsQueryDto) {
    return this.advertService.getAdvertsInProgress(query)
  }

  @Get('/completed')
  @LGResponse({ operationId: 'getCompletedAdverts', type: GetAdvertsDto })
  getCompletedAdverts(@Query() query: PagingQuery) {
    return this.advertService.getCompletedAdverts(query)
  }

  @Get()
  @LGResponse({ operationId: 'getAdverts', type: GetAdvertsDto })
  getAdverts(@Query() query: GetAdvertsQueryDto) {
    return this.advertService.getAdverts(query)
  }

  @Get(':id')
  @LGResponse({ operationId: 'getAdvertById', type: AdvertDto })
  getAdvertById(@Param('id') id: string) {
    return this.advertService.getAdvertById(id)
  }

  @Patch(':id')
  @LGResponse({ operationId: 'updateAdvert', type: AdvertDto })
  updateAdvert(
    @Param('id') id: string,
    @Body() advertUpdateDto: UpdateAdvertDto,
  ) {
    return this.advertService.updateAdvert(id, advertUpdateDto)
  }
}
