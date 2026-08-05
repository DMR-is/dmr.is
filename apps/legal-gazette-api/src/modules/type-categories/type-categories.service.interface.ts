import {
  TypesWithCategoriesResponseDto,
  TypeWithCategoriesQueryDto,
  TypeWithCategoriesResponseDto,
} from './dto/type-categories.dto'

export type FindByTypeIdOptions = {
  /**
   * Leave out categories that cannot be assigned to an advert
   * (see UNASSIGNABLE_CATEGORY_IDS). Defaults to false.
   */
  excludeUnassignable?: boolean
}

export interface ITypeCategoriesService {
  findAll(
    query: TypeWithCategoriesQueryDto,
  ): Promise<TypesWithCategoriesResponseDto>
  findByCategoryId(categoryId: string): Promise<TypesWithCategoriesResponseDto>
  findByTypeId(
    typeId: string,
    options?: FindByTypeIdOptions,
  ): Promise<TypeWithCategoriesResponseDto>
}

export const ITypeCategoriesService = Symbol('ITypeCategoriesService')
