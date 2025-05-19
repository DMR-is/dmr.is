import { Controller, Get, Inject, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { LegalGazetteApiTags } from '@dmr.is/legal-gazette/constants'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import {
  GetCategoriesDetailedDto,
  GetCategoriesDto,
  GetCategoriesQueryDto,
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
  @ApiTags(LegalGazetteApiTags.APPLICATION_API)
  @LGResponse({
    operationId: 'getCategories',
    type: GetCategoriesDto,
  })
  getCategories(@Query() query: GetCategoriesQueryDto) {
    return this.categoryService.getCategories(query)
  }

  @Get('detailed')
  @LGResponse({
    operationId: 'getCategoriesDetailed',
    type: GetCategoriesDetailedDto,
  })
  getCategoriesDetailed(@Query() query: GetCategoriesQueryDto) {
    return this.categoryService.getCategoriesDetailed(query)
  }
}
