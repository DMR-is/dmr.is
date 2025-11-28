import { Op } from 'sequelize'

import { Controller, Get, Param, Query } from '@nestjs/common'

import { UNASSIGNABLE_CATEGORY_IDS } from '../../../core/constants'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import {
  CategoryDto,
  CategoryModel,
  GetCategoriesDto,
  GetCategoriesQueryDto,
} from '../../../models/category.model'
import { TypeModel } from '../../../models/type.model'
import { BaseEntityController } from '../base-entity.controller'

// Note: This controller is used by all 3 apps (admin, public-web, application-web)
// Any authenticated user can access these endpoints
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
