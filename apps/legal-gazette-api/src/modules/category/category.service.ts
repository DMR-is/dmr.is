import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { baseEntityMigrate } from '@dmr.is/legal-gazette/dto'

import { TypeModel } from '../type/type.model'
import { GetCategoriesDto, GetCategoriesQueryDto } from './dto/category.dto'
import { CategoryModel } from './category.model'
import { ICategoryService } from './category.service.interface'

@Injectable()
export class CategoryService implements ICategoryService {
  constructor(
    @InjectModel(CategoryModel)
    private readonly categoryModel: typeof CategoryModel,
  ) {}

  async getCategories(query: GetCategoriesQueryDto): Promise<GetCategoriesDto> {
    const categories = await this.categoryModel.findAll({
      include: [
        {
          model: TypeModel,
          where: query.type ? { id: query.type } : undefined,
        },
      ],
    })

    return {
      categories: categories.map((c) => baseEntityMigrate(c)),
    }
  }
}
