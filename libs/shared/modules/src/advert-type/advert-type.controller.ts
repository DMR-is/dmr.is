import { Route } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import {
  Body,
  Controller,
  HttpException,
  Inject,
  Param,
  Query,
} from '@nestjs/common'

import { IAdvertTypeService } from './advert-type.service.interface'
import {
  AdvertTypeQuery,
  CreateAdvertTypeBody,
  CreateMainAdvertTypeBody,
  GetAdvertMainTypes,
  GetAdvertType,
  GetAdvertTypes,
  UpdateAdvertTypeBody,
  UpdateMainAdvertTypeBody,
} from './dto'

@Controller({ version: '1' })
export class AdvertTypeController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAdvertTypeService)
    private readonly advertTypeService: IAdvertTypeService,
  ) {}

  @Route({
    path: 'types',
    operationId: 'getTypes',
    query: [{ type: AdvertTypeQuery }],
    responseType: GetAdvertTypes,
  })
  /**
   * Returns all advert types for all departments and main types
   */
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
  /**
   * Returns all main advert types under all departments
   */
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
  /**
   * Returns an advert type by id
   */
  async getTypeById(@Param('id') id: string): Promise<GetAdvertType> {
    const result = await this.advertTypeService.getTypeById(id)

    if (!result.result.ok) {
      throw new HttpException(result.result.error, result.result.error.code)
    }

    return result.result.value
  }

  @Route({
    path: '/slug:slug',
    operationId: 'getTypeBySlug',
    params: [{ name: 'slug', type: 'string', required: true }],
    responseType: GetAdvertType,
  })
  /**
   * Returns an advert type by slug
   */
  async getTypeBySlug(@Param('slug') slug: string): Promise<GetAdvertType> {
    const result = await this.advertTypeService.getTypeBySlug(slug)

    if (!result.result.ok) {
      throw new HttpException(result.result.error, result.result.error.code)
    }

    return result.result.value
  }

  @Route({
    path: 'main/id/:departmentId',
    operationId: 'getMainTypesByDepartmentId',
    params: [{ name: 'departmentId', type: 'string', required: true }],
    responseType: GetAdvertMainTypes,
  })
  /**
   * Returns all main advert types by department id
   */
  async getMainTypesByDepartmentId(
    @Param('departmentId') departmentId: string,
  ): Promise<GetAdvertMainTypes> {
    const results = await this.advertTypeService.getMainTypes({
      department: departmentId,
      page: 1,
      pageSize: 100,
    })

    if (!results.result.ok) {
      throw new HttpException(results.result.error, results.result.error.code)
    }

    return results.result.value
  }

  @Route({
    path: 'main/slug/:departmentSlug',
    operationId: 'getMainTypesByDepartmentSlug',
    params: [{ name: 'departmentSlug', type: 'string', required: true }],
    responseType: GetAdvertMainTypes,
  })
  /**
   * Returns all main advert types by department slug
   */
  async getMainTypesByDepartmentSlug(
    @Param('departmentSlug') departmentSlug: string,
  ): Promise<GetAdvertMainTypes> {
    const results = await this.advertTypeService.getMainTypes({
      department: departmentSlug,
      page: 1,
      pageSize: 100,
    })

    if (!results.result.ok) {
      throw new HttpException(results.result.error, results.result.error.code)
    }

    return results.result.value
  }

  @Route({
    method: 'post',
    path: '',
    operationId: 'createType',
    bodyType: CreateAdvertTypeBody,
  })
  /**
   * Creates a new advert type
   */
  async createType(@Body() body: CreateAdvertTypeBody): Promise<void> {
    const result = await this.advertTypeService.createType(body)

    if (!result.result.ok) {
      throw new HttpException(result.result.error, result.result.error.code)
    }
  }

  @Route({
    method: 'put',
    path: '/type/:id',
    operationId: 'updateType',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateAdvertTypeBody,
    responseType: GetAdvertType,
  })
  /**
   * Updates an advert type by id
   */
  async updateType(
    @Param('id') id: string,
    @Body() body: CreateAdvertTypeBody,
  ): Promise<GetAdvertType> {
    const result = await this.advertTypeService.updateType(id, body)

    if (!result.result.ok) {
      throw new HttpException(result.result.error, result.result.error.code)
    }

    return result.result.value
  }

  @Route({
    method: 'delete',
    path: '/type/:id',
    operationId: 'deleteType',
    params: [{ name: 'id', type: 'string', required: true }],
  })
  /**
   * Deletes an advert type by id
   */
  async deleteType(@Param('id') id: string): Promise<void> {
    ResultWrapper.ok()
  }

  @Route({
    method: 'post',
    path: 'main',
    operationId: 'createMainType',
  })
  /**
   * Creates a new main advert type
   */
  async createMainType(@Body() body: CreateMainAdvertTypeBody): Promise<void> {
    ResultWrapper.ok()
  }

  @Route({
    method: 'put',
    path: 'main/id/:id',
    operationId: 'updateMainType',
    params: [{ name: 'id', type: 'string', required: true }],
    bodyType: UpdateMainAdvertTypeBody,
  })
  /**
   * Updates a main advert type by id
   */
  async updateMainType(
    @Param('id') id: string,
    @Body() body: UpdateMainAdvertTypeBody,
  ): Promise<void> {
    ResultWrapper.ok()
  }

  @Route({
    method: 'delete',
    path: 'main/id/:id',
    operationId: 'deleteMainType',
    params: [{ name: 'id', type: 'string', required: true }],
  })
  /**
   * Deletes a main advert type by id, deletes all advert types under it
   */
  async deleteMainType(@Param('id') id: string): Promise<void> {
    ResultWrapper.ok()
  }
}
