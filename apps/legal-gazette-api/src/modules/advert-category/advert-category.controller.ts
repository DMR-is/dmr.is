import { Controller, Get, Inject, Query } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import {
  GetAdvertCategoriesDetailedDto,
  GetAdvertCategoriesDto,
  GetAdvertCategoriesQueryDto,
} from './dto/advert-category.dto'
import { IAdvertCategoryService } from './advert-category.service.interface'

@Controller({
  path: 'categories',
  version: '1',
})
export class AdvertCategoryController {
  constructor(
    @Inject(IAdvertCategoryService)
    private readonly categoryService: IAdvertCategoryService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getCategories',
    type: GetAdvertCategoriesDto,
  })
  getCategories(@Query() query: GetAdvertCategoriesQueryDto) {
    return this.categoryService.getCategories(query)
  }

  @Get('detailed')
  @LGResponse({
    operationId: 'getCategoriesDetailed',
    type: GetAdvertCategoriesDetailedDto,
  })
  getCategoriesDetailed(@Query() query: GetAdvertCategoriesQueryDto) {
    return this.categoryService.getCategoriesDetailed(query)
  }
}
