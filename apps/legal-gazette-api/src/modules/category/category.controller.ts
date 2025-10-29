import { Op } from 'sequelize'

import { Controller, Get, Param, Query } from '@nestjs/common'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { UNASSIGNABLE_CATEGORY_IDS } from '../../lib/constants'
import { BaseEntityController } from '../base-entity/base-entity.controller'
import { TypeModel } from '../type/type.model'
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
  typeof CategoryModel,
  CategoryDto
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
    const categories = await super.findAll({
      where: query.excludeUnassignable
        ? {
            id: { [Op.notIn]: UNASSIGNABLE_CATEGORY_IDS },
          }
        : undefined,
      include: [
        {
          model: TypeModel,
          where: query.type ? { id: query.type } : undefined,
        },
      ],
    })

    return {
      categories: categories,
    }
  }
}
