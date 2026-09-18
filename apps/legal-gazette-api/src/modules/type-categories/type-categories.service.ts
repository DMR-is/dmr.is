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
import {
  FindByTypeIdOptions,
  ITypeCategoriesService,
} from './type-categories.service.interface'

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

  async findByTypeId(
    typeId: string,
    options?: FindByTypeIdOptions,
  ): Promise<TypeWithCategoriesResponseDto> {
    const type = await this.typeModel.unscoped().findOneOrThrow({
      attributes: ['id', 'title', 'slug'],
      where: { id: { [Op.eq]: typeId } },
      include: [
        {
          model: CategoryModel,
          where: options?.excludeUnassignable ? { active: true } : undefined,
          required: false,
        },
      ],
      // CategoryModel's default scope orders by title, but an order inside a
      // non-separate include is not emitted by Sequelize, so it has to be
      // declared at the top level. Without it the category order - and therefore
      // anything derived from categories[0] - is whatever Postgres returns.
      // Ordered via the association name: passing the model itself throws
      // "Unable to find a valid association" for this belongsToMany.
      order: [['categories', 'title', 'ASC']],
    })

    return { type: type.fromModelWithCategories() }
  }
}
