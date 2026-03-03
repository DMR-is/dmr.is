import { Op } from 'sequelize'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CategoryModel } from '../../models/category.model'
import { TypeModel } from '../../models/type.model'
import {
  TypesWithCategoriesResponseDto,
  TypeWithCategoriesQueryDto,
  TypeWithCategoriesResponseDto,
} from './dto/type-categories.dto'
import { ITypeCategoriesService } from './type-categories.service.interface'

@Injectable()
export class TypeCategoriesService implements ITypeCategoriesService {
  constructor(
    @InjectModel(TypeModel) private readonly typeModel: typeof TypeModel,
  ) {}
  async findAll(
    query: TypeWithCategoriesQueryDto,
  ): Promise<TypesWithCategoriesResponseDto> {
    const types = await this.typeModel.unscoped().findAll({
      attributes: ['id', 'title', 'slug'],
      where: query.typeId ? { id: { [Op.eq]: query.typeId } } : undefined,
      include: [
        {
          model: CategoryModel,
          where: query.categoryId
            ? { id: { [Op.eq]: query.categoryId } }
            : undefined,
        },
      ],
    })

    return {
      types: types.map((t) => t.fromModelWithCategories()),
    }
  }
  async findByCategoryId(
    categoryId: string,
  ): Promise<TypesWithCategoriesResponseDto> {
    const types = await this.typeModel.unscoped().findAll({
      attributes: ['id', 'title', 'slug'],
      include: [
        {
          model: CategoryModel,
          where: { id: { [Op.eq]: categoryId } },
        },
      ],
    })

    return {
      types: types.map((t) => t.fromModelWithCategories()),
    }
  }

  async findByTypeId(typeId: string): Promise<TypeWithCategoriesResponseDto> {
    const type = await this.typeModel.unscoped().findOneOrThrow({
      attributes: ['id', 'title', 'slug'],
      where: { id: { [Op.eq]: typeId } },
      include: [
        {
          model: CategoryModel,
        },
      ],
    })

    return { type: type.fromModelWithCategories() }
  }
}
