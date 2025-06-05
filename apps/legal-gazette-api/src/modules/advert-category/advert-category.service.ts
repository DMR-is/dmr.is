import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { baseEntityMigrate } from '@dmr.is/legal-gazette/dto'

import { AdvertTypeModel } from '../advert-type/advert-type.model'
import {
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
    const categories = await this.advertCategoryModel.findAll({
      include: [
        {
          model: AdvertTypeModel,
          where: query.type ? { id: query.type } : undefined,
        },
      ],
    })

    return {
      categories: categories.map((c) => baseEntityMigrate(c)),
    }
  }
}
