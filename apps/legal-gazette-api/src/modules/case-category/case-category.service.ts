import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  baseEntityDetailedMigrate,
  baseEntityMigrate,
  migrate,
} from '@dmr.is/legal-gazette/dto'

import {
  CaseCategoryDetailedDto,
  CaseCategoryDto,
  GetCaseCategoriesDetailedDto,
  GetCaseCategoriesDto,
} from './dto/case-category.dto'
import { CaseCategoryModel } from './case-category.model'
import { ICaseCategoryService } from './case-category.service.interface'

@Injectable()
export class CaseCategoryService implements ICaseCategoryService {
  constructor(
    @InjectModel(CaseCategoryModel)
    private readonly caseCategoryModel: typeof CaseCategoryModel,
  ) {}

  async getCategories(): Promise<GetCaseCategoriesDto> {
    const categories = await this.caseCategoryModel.findAll()

    return {
      categories: categories.map((c) =>
        migrate<CaseCategoryDto>({
          model: c,
          defaultMigration: baseEntityMigrate,
          additionalProps: [['typeId'], ['type', baseEntityMigrate]],
        }),
      ),
    }
  }
  async getCategoriesDetailed(): Promise<GetCaseCategoriesDetailedDto> {
    const categories = await this.caseCategoryModel.scope('detailed').findAll()

    const migrated = categories.map((c) =>
      migrate<CaseCategoryDetailedDto>({
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
