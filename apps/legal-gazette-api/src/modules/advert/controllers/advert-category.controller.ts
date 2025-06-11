import { Controller, Param, Patch } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdvertCategoryModel } from '../../advert-category/advert-category.model'

@Controller({
  path: 'advert:id/category',
})
export class AdvertCategoryController {
  constructor(
    @InjectModel(AdvertCategoryModel)
    private readonly advertCategoryModel: typeof AdvertCategoryModel,
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
