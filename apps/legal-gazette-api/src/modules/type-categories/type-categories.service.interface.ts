import { TypeWithCategoriesResponseDto } from './dto/type-categories.dto'

export type FindByTypeIdOptions = {
  /**
   * Leave out categories that cannot be assigned to an advert
   * (see UNASSIGNABLE_CATEGORY_IDS). Defaults to false.
   */
  excludeUnassignable?: boolean
}

export interface ITypeCategoriesService {
  findByTypeId(
    typeId: string,
    options?: FindByTypeIdOptions,
  ): Promise<TypeWithCategoriesResponseDto>
}

export const ITypeCategoriesService = Symbol('ITypeCategoriesService')
