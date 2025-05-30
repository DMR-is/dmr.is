import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  baseEntityDetailedMigrate,
  baseEntityMigrate,
  migrate,
} from '@dmr.is/legal-gazette/dto'

import {
  CategoryDetailedDto,
  CategoryDto,
  GetCategoriesDetailedDto,
  GetCategoriesDto,
  GetCategoriesQueryDto,
} from './dto/case-category.dto'
import { CaseCategoryModel } from './case-category.model'
import { ICaseCategoryService } from './case-category.service.interface'

@Injectable()
export class CaseCategoryService implements ICaseCategoryService {
  constructor(
    @InjectModel(CaseCategoryModel)
    private readonly caseCategoryModel: typeof CaseCategoryModel,
  ) {}

  async getCategories(query: GetCategoriesQueryDto): Promise<GetCategoriesDto> {
    const categories = await this.caseCategoryModel
      .scope({ method: ['byType', query.type] })
      .scope('defaultScope')
      .findAll()

    return {
      categories: categories.map((c) =>
        migrate<CategoryDto>({
          model: c,
          defaultMigration: baseEntityMigrate,
          additionalProps: [['typeId'], ['type', baseEntityMigrate]],
        }),
      ),
    }
  }
  async getCategoriesDetailed(
    query: GetCategoriesQueryDto,
  ): Promise<GetCategoriesDetailedDto> {
    const categories = await this.caseCategoryModel
      .scope({ method: ['byType', query.type] })
      .scope('detailed')
      .findAll()

    const migrated = categories.map((c) =>
      migrate<CategoryDetailedDto>({
        model: c,
        defaultMigration: baseEntityDetailedMigrate,
        additionalProps: [['typeId'], ['type', baseEntityDetailedMigrate]],
      }),
    )

    return {
      categories: migrated,
    }
  }
}
