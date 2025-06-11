import { Controller, Param, Patch } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { CategoryModel } from '../../category/category.model'

@Controller({
  path: 'advert:id/category',
})
export class AdvertCategoryController {
  constructor(
    @InjectModel(CategoryModel)
    private readonly advertCategoryModel: typeof CategoryModel,
  ) {}

  @Patch()
  @LGResponse({ operationId: 'updateAdvertCategory' })
  async updateAdvertCategory(
    @Param('id') id: string,
    @Param('categoryId', new UUIDValidationPipe())
    categoryId: string,
  ): Promise<void> {
    await this.advertCategoryModel.setAdvertCategory(id, categoryId)
  }
}
