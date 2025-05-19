import { Controller, Get, Inject } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import {
  GetCaseCategoriesDetailedDto,
  GetCaseCategoriesDto,
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
  getCategories() {
    return this.categoryService.getCategories()
  }

  @Get('detailed')
  @LGResponse({
    operationId: 'getCategoriesDetailed',
    type: GetCaseCategoriesDetailedDto,
  })
  getCategoriesDetailed() {
    return this.categoryService.getCategoriesDetailed()
  }
}
