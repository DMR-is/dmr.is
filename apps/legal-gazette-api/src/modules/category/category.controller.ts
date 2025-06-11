import { Controller, Get, Inject, Query } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { GetCategoriesDto, GetCategoriesQueryDto } from './dto/category.dto'
import { ICategoryService } from './category.service.interface'

@Controller({
  path: 'categories',
  version: '1',
})
export class CategoryController {
  constructor(
    @Inject(ICategoryService)
    private readonly categoryService: ICategoryService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getCategories',
    type: GetCategoriesDto,
  })
  getCategories(@Query() query: GetCategoriesQueryDto) {
    return this.categoryService.getCategories(query)
  }
}
