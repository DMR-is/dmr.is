import { Route } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { Controller, HttpException, Inject, Param, Query } from '@nestjs/common'

import { IAdvertTypeService } from './advert-type.service.interface'
import {
  AdvertTypeQuery,
  GetAdvertMainType,
  GetAdvertMainTypes,
  GetAdvertType,
  GetAdvertTypes,
} from './dto'

@Controller({ path: 'advert-types', version: '1' })
export class AdvertTypeController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAdvertTypeService)
    private readonly advertTypeService: IAdvertTypeService,
  ) {}

  @Route({
    path: '/types',
    operationId: 'getTypes',
    query: [{ type: AdvertTypeQuery }],
    responseType: GetAdvertTypes,
  })
  async getTypes(@Query() query?: AdvertTypeQuery): Promise<GetAdvertTypes> {
    const results = await this.advertTypeService.getTypes(query)

    if (!results.result.ok) {
      throw new HttpException(results.result.error, results.result.error.code)
    }

    return results.result.value
  }

  @Route({
    path: '/main-types',
    operationId: 'getMainTypes',
    query: [{ type: AdvertTypeQuery }],
    responseType: GetAdvertMainTypes,
  })
  async getMainTypes(
    @Query() query?: AdvertTypeQuery,
  ): Promise<GetAdvertMainTypes> {
    const results = await this.advertTypeService.getMainTypes(query)

    if (!results.result.ok) {
      throw new HttpException(results.result.error, results.result.error.code)
    }

    return results.result.value
  }

  @Route({
    path: '/types/:id',
    operationId: 'getTypeById',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetAdvertType,
  })
  async getTypeById(@Param('id') id: string): Promise<GetAdvertType> {
    const result = await this.advertTypeService.getTypeById(id)

    if (!result.result.ok) {
      throw new HttpException(result.result.error, result.result.error.code)
    }

    return result.result.value
  }

  @Route({
    path: '/main-types/:id',
    operationId: 'getMainTypeById',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetAdvertMainType,
  })
  async getMainTypeById(@Param('id') id: string): Promise<GetAdvertMainType> {
    const result = await this.advertTypeService.getMainTypeById(id)

    if (!result.result.ok) {
      throw new HttpException(result.result.error, result.result.error.code)
    }

    return result.result.value
  }
}
