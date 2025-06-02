import { Controller, Get, Inject, Query } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import {
  GetCaseCategoriesDetailedDto,
  GetCaseCategoriesDto,
  GetCaseCategoriesQueryDto,
} from './dto/case-category.dto'
import { ICaseCategoryService } from './case-category.service.interface'

@Controller({
  path: 'categories',
  version: '1',
})
export class CaseCategoryController {
  constructor(
    @Inject(ICaseCategoryService)
    private readonly categoryService: ICaseCategoryService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getCategories',
    type: GetCaseCategoriesDto,
  })
  getCategories(@Query() query: GetCaseCategoriesQueryDto) {
    return this.categoryService.getCategories(query)
  }

  @Get('detailed')
  @LGResponse({
    operationId: 'getCategoriesDetailed',
    type: GetCaseCategoriesDetailedDto,
  })
  getCategoriesDetailed(@Query() query: GetCaseCategoriesQueryDto) {
    return this.categoryService.getCategoriesDetailed(query)
  }
}
