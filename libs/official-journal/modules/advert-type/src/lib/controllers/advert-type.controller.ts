import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  AdvertTypeQuery,
  GetAdvertMainType,
  GetAdvertMainTypes,
  GetAdvertType,
  GetAdvertTypes,
} from '@dmr.is/shared/dto'

import { Controller, Get, Inject, Param, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { IAdvertTypeService } from '../advert-type.service.interface'
import { AdvertTypeError } from '../advert-type-error'

@Controller({ path: 'advert-types', version: '1' })
export class AdvertTypeController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAdvertTypeService)
    private readonly advertTypeService: IAdvertTypeService,
  ) {}

  @Get('/types')
  @ApiOperation({ operationId: 'getTypes' })
  @ApiResponse({ status: 200, type: GetAdvertTypes })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async getTypes(@Query() query?: AdvertTypeQuery): Promise<GetAdvertTypes> {
    const results = await this.advertTypeService.getTypes(query)

    if (!results.result.ok) {
      throw new AdvertTypeError(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }

  @Get('/main-types')
  @ApiOperation({ operationId: 'getMainTypes' })
  @ApiResponse({ status: 200, type: GetAdvertMainTypes })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async getMainTypes(
    @Query() query?: AdvertTypeQuery,
  ): Promise<GetAdvertMainTypes> {
    const results = await this.advertTypeService.getMainTypes(query)

    if (!results.result.ok) {
      throw new AdvertTypeError(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }

  @Get('/types/:id')
  @ApiOperation({ operationId: 'getTypeById' })
  @ApiResponse({ status: 200, type: GetAdvertType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async getTypeById(@Param('id') id: string): Promise<GetAdvertType> {
    const result = await this.advertTypeService.getTypeById(id)

    if (!result.result.ok) {
      throw new AdvertTypeError(
        result.result.error.message,
        result.result.error.code,
      )
    }

    return result.result.value
  }

  @Get('/main-types/:id')
  @ApiOperation({ operationId: 'getMainTypeById' })
  @ApiResponse({ status: 200, type: GetAdvertMainType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async getMainTypeById(@Param('id') id: string): Promise<GetAdvertMainType> {
    const result = await this.advertTypeService.getMainTypeById(id)

    if (!result.result.ok) {
      throw new AdvertTypeError(
        result.result.error.message,
        result.result.error.code,
      )
    }

    return result.result.value
  }
}
