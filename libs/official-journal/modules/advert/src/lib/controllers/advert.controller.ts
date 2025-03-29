import { ResultWrapper } from '@dmr.is/types'
import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'
import { IAdvertService } from '../advert.service.interface'
import { advertsToRss } from '../utils'
import { GetAdvertResponse } from '../dto/get-advert-response.dto'
import { GetAdvertsQueryParams } from '../dto/get-adverts-query.dto'
import {
  GetSimilarAdvertsResponse,
  GetAdvertsResponse,
} from '../dto/get-adverts-responses.dto'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

@Controller({
  path: 'adverts',
  version: '1',
})
export class AdvertController {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
  ) {}

  @Get('/rss/:id')
  @ApiOperation({ operationId: 'getRssFeed' })
  @ApiResponse({ status: 200 })
  async getRssFeed(@Param() param?: { id: string }) {
    const adverts = ResultWrapper.unwrap(
      await this.advertService.getAdverts({
        department: param?.id.toLowerCase(),
        pageSize: 100,
      }),
    )
    return advertsToRss(adverts.adverts, param?.id?.toLowerCase())
  }

  @Get('similar/:id')
  @ApiOperation({ operationId: 'getSimilarAdvertsById' })
  @ApiResponse({ status: 200, type: GetSimilarAdvertsResponse })
  async similarAdverts(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetSimilarAdvertsResponse> {
    return ResultWrapper.unwrap(await this.advertService.getSimilarAdverts(id))
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getAdvertById' })
  @ApiResponse({ status: 200, type: GetAdvertResponse })
  async advert(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetAdvertResponse> {
    return ResultWrapper.unwrap(await this.advertService.getAdvert(id))
  }

  @Get('')
  @ApiOperation({ operationId: 'getAdverts' })
  @ApiResponse({ status: 200, type: GetAdvertsResponse })
  async adverts(
    @Query() params?: GetAdvertsQueryParams,
  ): Promise<GetAdvertsResponse> {
    return ResultWrapper.unwrap(await this.advertService.getAdverts(params))
  }
}
