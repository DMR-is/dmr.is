import { Sequelize } from 'sequelize-typescript'
import { Route } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { Body, Controller, HttpException, Inject, Param } from '@nestjs/common'

import { IAdvertTypeService } from './advert-type.service.interface'
import {
  CreateAdvertMainTypeBody,
  CreateAdvertMainTypeBulk,
  CreateAdvertTypeBody,
  GetAdvertMainType,
  GetAdvertType,
  UpdateAdvertMainType,
  UpdateAdvertTypeBody,
} from './dto'

const LOGGING_CATEGORY = 'advert-type-admin-controller'

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
  })
  async createType(@Body() body: CreateAdvertTypeBody): Promise<GetAdvertType> {
    const result = await this.advertTypeService.createType(body)

    if (!result.result.ok) {
      this.logger.warn('Failed to create advert type', {
        category: LOGGING_CATEGORY,
      })
      throw new HttpException(result.result.error, result.result.error.code)
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
    @Body() body: CreateAdvertTypeBody,
  ): Promise<GetAdvertType> {
    const result = await this.advertTypeService.updateType(id, body)

    if (!result.result.ok) {
      this.logger.warn('Failed to update advert type', {
        category: LOGGING_CATEGORY,
      })
      throw new HttpException(result.result.error, result.result.error.code)
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
      this.logger.warn('Failed to delete advert type', {
        category: LOGGING_CATEGORY,
      })
      throw new HttpException(result.result.error, result.result.error.code)
    }
  }

  @Route({
    method: 'post',
    path: '/main-types',
    operationId: 'createMainType',
  })
  async createMainType(
    @Body() body: CreateAdvertMainTypeBody,
  ): Promise<GetAdvertMainType> {
    const results = await this.advertTypeService.createMainType(body)

    if (!results.result.ok) {
      this.logger.warn('Failed to create advert main type', {
        category: LOGGING_CATEGORY,
      })
      throw new HttpException(results.result.error, results.result.error.code)
    }

    return results.result.value
  }

  @Route({
    method: 'post',
    path: '/main-types/bulk',
    operationId: 'createMainTypesBulk',
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

      this.logger.warn('Failed to bulk create advert main types', {
        category: LOGGING_CATEGORY,
      })

      throw new HttpException('Failed to bulk create advert main types', 500)
    }

    await transaction.commit()
  }

  @Route({
    method: 'put',
    path: '/main-types/:id',
    operationId: 'updateMainType',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateAdvertMainType,
    responseType: GetAdvertMainType,
  })
  async updateMainType(
    @Param('id') id: string,
    @Body() body: UpdateAdvertMainType,
  ): Promise<GetAdvertMainType> {
    const results = await this.advertTypeService.updateMainType(id, body)

    if (!results.result.ok) {
      this.logger.warn('Failed to update advert main type', {
        category: LOGGING_CATEGORY,
      })
      throw new HttpException(results.result.error, results.result.error.code)
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
      this.logger.warn('Failed to delete advert main type', {
        category: LOGGING_CATEGORY,
      })
      throw new HttpException(results.result.error, results.result.error.code)
    }
  }
}
