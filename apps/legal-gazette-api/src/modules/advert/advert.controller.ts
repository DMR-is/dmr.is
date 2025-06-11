import { Controller, Get, Inject, Param, Put, Query } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiParam } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { EnumValidationPipe } from '@dmr.is/pipelines'
import { PagingQuery } from '@dmr.is/shared/dto'

import {
  AdvertStatusIdEnum,
  AdvertStatusModel,
} from '../advert-status/advert-status.model'
import {
  AdvertDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
} from './dto/advert.dto'
import { IAdvertService } from './advert.service.interface'

@Controller({
  path: 'adverts',
  version: '1',
})
export class AdvertController {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
    @InjectModel(AdvertStatusModel)
    private readonly advertStatusModel: typeof AdvertStatusModel,
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

  @Put(':id/status/:statusId')
  @ApiParam({
    enum: AdvertStatusIdEnum,
    name: 'statusId',
    enumName: 'AdvertStatusIdEnum',
  })
  @LGResponse({ operationId: 'updateAdvertStatus' })
  async updateAdvertStatus(
    @Param('id') id: string,
    @Param('statusId', new EnumValidationPipe(AdvertStatusIdEnum))
    statusId: AdvertStatusIdEnum,
  ): Promise<void> {
    await this.advertStatusModel.setAdvertStatus(id, statusId)
  }
}
