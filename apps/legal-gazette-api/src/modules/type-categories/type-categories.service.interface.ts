import {
  TypesWithCategoriesResponseDto,
  TypeWithCategoriesQueryDto,
  TypeWithCategoriesResponseDto,
} from './dto/type-categories.dto'

export interface ITypeCategoriesService {
  findAll(
    query: TypeWithCategoriesQueryDto,
  ): Promise<TypesWithCategoriesResponseDto>
  findByCategoryId(categoryId: string): Promise<TypesWithCategoriesResponseDto>
  findByTypeId(typeId: string): Promise<TypeWithCategoriesResponseDto>
}

export const ITypeCategoriesService = Symbol('ITypeCategoriesService')
