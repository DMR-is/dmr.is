import { Sequelize } from 'sequelize-typescript'
import { LogMethod, Route } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CreateAdvertMainTypeBody,
  CreateAdvertMainTypeBulk,
  CreateAdvertTypeBody,
  GetAdvertMainType,
  GetAdvertType,
  UpdateAdvertMainType,
  UpdateAdvertTypeBody,
} from '@dmr.is/shared/dto'

import { Body, Controller, Inject, Param, Put } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger'

import { IAdvertTypeService } from './advert-type.service.interface'
import { AdvertTypeError } from './advert-type-error'

@Controller({ path: 'advert-types', version: '1' })
export class AdvertTypeAdminController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAdvertTypeService)
    private readonly advertTypeService: IAdvertTypeService,
    private sequelize: Sequelize,
  ) {}

  @Route({
    method: 'post',
    path: '/types',
    operationId: 'createType',
    bodyType: CreateAdvertTypeBody,
    responseType: GetAdvertType,
  })
  async createType(@Body() body: CreateAdvertTypeBody): Promise<GetAdvertType> {
    const result = await this.advertTypeService.createType(body)

    if (!result.result.ok) {
      throw new AdvertTypeError(
        result.result.error.message,
        result.result.error.code,
      )
    }

    return result.result.value
  }

  @Route({
    method: 'put',
    path: '/types/:id',
    operationId: 'updateType',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateAdvertTypeBody,
    responseType: GetAdvertType,
  })
  async updateType(
    @Param('id') id: string,
    @Body() body: UpdateAdvertTypeBody,
  ): Promise<GetAdvertType> {
    const result = await this.advertTypeService.updateType(id, body)

    if (!result.result.ok) {
      throw new AdvertTypeError(
        result.result.error.message,
        result.result.error.code,
      )
    }

    return result.result.value
  }

  @Route({
    method: 'delete',
    path: '/types/:id',
    operationId: 'deleteType',
    params: [{ name: 'id', type: 'string', required: true }],
  })
  async deleteType(@Param('id') id: string): Promise<void> {
    const result = await this.advertTypeService.deleteType(id)

    if (!result.result.ok) {
      throw new AdvertTypeError(
        result.result.error.message,
        result.result.error.code,
      )
    }
  }
  @Route({
    method: 'post',
    path: '/main-types',
    operationId: 'createMainType',
    bodyType: CreateAdvertMainTypeBody,
    responseType: GetAdvertMainType,
  })
  async createMainType(
    @Body() body: CreateAdvertMainTypeBody,
  ): Promise<GetAdvertMainType> {
    const results = await this.advertTypeService.createMainType(body)

    if (!results.result.ok) {
      throw new AdvertTypeError(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }
  @Route({
    method: 'post',
    path: '/main-types/bulk',
    operationId: 'createMainTypesBulk',
    bodyType: CreateAdvertMainTypeBulk,
  })
  async createMainTypesBulk(
    @Body() body: CreateAdvertMainTypeBulk,
  ): Promise<void> {
    const transaction = await this.sequelize.transaction()
    const promises = body.mainTypes.map((item) =>
      this.advertTypeService.createMainType(item, transaction),
    )

    const bulkResults = await Promise.all(promises)

    const errors = bulkResults.filter((result) => !result.result.ok)
    if (errors.length > 0) {
      await transaction.rollback()

      throw new AdvertTypeError('Ekki tókst að búa til allar tegundir', 500)
    }

    await transaction.commit()
  }
  @Put('/main-types/:id')
  @ApiOperation({
    operationId: 'updateMainType',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateAdvertMainType })
  @ApiResponse({ status: 200, type: GetAdvertMainType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  @LogMethod()
  async updateMainType(
    @Param('id') id: string,
    @Body() body: UpdateAdvertMainType,
  ): Promise<GetAdvertMainType> {
    const results = await this.advertTypeService.updateMainType(id, body)

    if (!results.result.ok) {
      throw new AdvertTypeError(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }
  @Route({
    method: 'delete',
    path: '/main-types/:id',
    operationId: 'deleteMainType',
    params: [{ name: 'id', type: 'string', required: true }],
  })
  async deleteMainType(@Param('id') id: string): Promise<void> {
    const results = await this.advertTypeService.deleteMainType(id)

    if (!results.result.ok) {
      throw new AdvertTypeError(
        results.result.error.message,
        results.result.error.code,
      )
    }
  }
}
