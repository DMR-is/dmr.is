import { Controller, Get, Inject, Param, Query } from '@nestjs/common'

import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import {
  TypesWithCategoriesResponseDto,
  TypeWithCategoriesQueryDto,
  TypeWithCategoriesResponseDto,
} from '../../models/type-categories.model'
import { ITypeCategoriesService } from './type-categories.service.interface'

@Controller({
  path: 'type-categories',
  version: '1',
})
export class TypeWithCategoriesController {
  constructor(
    @Inject(ITypeCategoriesService)
    private readonly typeCategoriesService: ITypeCategoriesService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getTypeCategories',
    type: TypesWithCategoriesResponseDto,
  })
  getTypeCategories(@Query() query: TypeWithCategoriesQueryDto) {
    return this.typeCategoriesService.findAll(query)
  }

  @Get('category/:categoryId')
  @LGResponse({
    operationId: 'getTypeCategoriesByCategoryId',
    type: TypesWithCategoriesResponseDto,
  })
  getTypeCategoriesByCategoryId(
    @Param('categoryId', new UUIDValidationPipe()) categoryId: string,
  ) {
    return this.typeCategoriesService.findByCategoryId(categoryId)
  }

  @Get('type/:typeId')
  @LGResponse({
    operationId: 'getTypeCategoriesByTypeId',
    type: TypeWithCategoriesResponseDto,
  })
  getTypeCategoriesByTypeId(
    @Param('typeId', new UUIDValidationPipe()) typeId: string,
  ) {
    return this.typeCategoriesService.findByTypeId(typeId)
  }
}
