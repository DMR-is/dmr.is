import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  baseEntityDetailedMigrate,
  baseEntityMigrate,
  migrate,
} from '@dmr.is/legal-gazette/dto'

import {
  AdvertCategoryDetailedDto,
  AdvertCategoryDto,
  GetAdvertCategoriesDetailedDto,
  GetAdvertCategoriesDto,
  GetAdvertCategoriesQueryDto,
} from './dto/advert-category.dto'
import { AdvertCategoryModel } from './advert-category.model'
import { IAdvertCategoryService } from './advert-category.service.interface'

@Injectable()
export class AdvertCategoryService implements IAdvertCategoryService {
  constructor(
    @InjectModel(AdvertCategoryModel)
    private readonly advertCategoryModel: typeof AdvertCategoryModel,
  ) {}

  async getCategories(
    query: GetAdvertCategoriesQueryDto,
  ): Promise<GetAdvertCategoriesDto> {
    const categories = await this.advertCategoryModel
      .scope({ method: ['byType', query.type] })
      .scope('defaultScope')
      .findAll()

    return {
      categories: categories.map((c) =>
        migrate<AdvertCategoryDto>({
          model: c,
          defaultMigration: baseEntityMigrate,
          additionalProps: [['typeId'], ['type', baseEntityMigrate]],
        }),
      ),
    }
  }
  async getCategoriesDetailed(
    query: GetAdvertCategoriesQueryDto,
  ): Promise<GetAdvertCategoriesDetailedDto> {
    const categories = await this.advertCategoryModel
      .scope({ method: ['byType', query.type] })
      .scope('detailed')
      .findAll()

    const migrated = categories.map((c) =>
      migrate<AdvertCategoryDetailedDto>({
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
