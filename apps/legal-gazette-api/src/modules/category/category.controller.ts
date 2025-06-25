import { Controller, Get, Param, Query } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { BaseEntityController } from '../base-entity/base-entity.controller'
import {
  CategoryDto,
  GetCategoriesDto,
  GetCategoriesQueryDto,
} from './dto/category.dto'
import { CategoryModel } from './category.model'

@Controller({
  path: 'categories',
  version: '1',
})
export class CategoryController extends BaseEntityController<
  typeof CategoryModel
> {
  constructor() {
    super(CategoryModel)
  }

  @Get('slug/:slug')
  @LGResponse({ operationId: 'getCategoryBySlug', type: CategoryDto })
  async findBySlug(@Param('slug') slug: string): Promise<CategoryDto> {
    return super.findBySlug(slug)
  }

  @Get(':id')
  @LGResponse({ operationId: 'getCategory', type: CategoryDto })
  async findById(@Param('id') id: string): Promise<CategoryDto> {
    return super.findById(id)
  }

  @Get()
  @LGResponse({ operationId: 'getCategories', type: GetCategoriesDto })
  async findAll(
    @Query() query: GetCategoriesQueryDto,
  ): Promise<GetCategoriesDto> {
    const options = {}

    if (query.type) {
      Object.assign(options, {
        where: {
          typeId: query.type,
        },
      })
    }

    const categories = await super.findAll(options)

    return {
      categories: categories,
    }
  }
}
