import { Sequelize } from 'sequelize-typescript'
import { LogMethod } from '@dmr.is/decorators'
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

import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common'
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

  @Post('/types')
  @ApiOperation({ operationId: 'createType' })
  @ApiBody({ type: CreateAdvertTypeBody })
  @ApiResponse({ status: HttpStatus.CREATED, type: GetAdvertType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  @LogMethod()
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

  @Put('/types/:id')
  @ApiOperation({ operationId: 'updateType' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateAdvertTypeBody })
  @ApiResponse({ status: 200, type: GetAdvertType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  @LogMethod()
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

  @Delete('/types/:id')
  @ApiOperation({ operationId: 'deleteType' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  @LogMethod()
  async deleteType(@Param('id') id: string): Promise<void> {
    const result = await this.advertTypeService.deleteType(id)

    if (!result.result.ok) {
      throw new AdvertTypeError(
        result.result.error.message,
        result.result.error.code,
      )
    }
  }

  @Post('/main-types')
  @ApiOperation({ operationId: 'createMainType' })
  @ApiBody({ type: CreateAdvertMainTypeBody })
  @ApiResponse({ status: HttpStatus.CREATED, type: GetAdvertMainType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  @LogMethod()
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

  @Post('/main-types/bulk')
  @ApiOperation({ operationId: 'createMainTypesBulk' })
  @ApiBody({ type: CreateAdvertMainTypeBulk })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  @LogMethod()
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
  @ApiOperation({ operationId: 'updateMainType' })
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

  @Delete('/main-types/:id')
  @ApiOperation({ operationId: 'deleteMainType' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  @LogMethod()
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
