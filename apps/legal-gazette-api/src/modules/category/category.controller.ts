import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { Subscriptions } from '../../guards/subscriber/subscriber.decorator'
import { Subscription } from '../../guards/subscriber/subscriber.enum'
import { BaseEntityController } from '../base-entity/base-entity.controller'
import {
  CategoryDto,
  GetCategoriesDto,
  GetCategoriesQueryDto,
} from './dto/category.dto'
import { CategoryModel } from './category.model'

@ApiBearerAuth()
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
  @Subscriptions(Subscription.ACTIVE)
  @LGResponse({ operationId: 'getCategoryBySlug', type: CategoryDto })
  async findBySlug(@Param('slug') slug: string): Promise<CategoryDto> {
    return super.findBySlug(slug)
  }

  @Get(':id')
  @Subscriptions(Subscription.ACTIVE)
  @LGResponse({ operationId: 'getCategory', type: CategoryDto })
  async findById(@Param('id') id: string): Promise<CategoryDto> {
    return super.findById(id)
  }

  @Get()
  @Subscriptions(Subscription.ACTIVE)
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
