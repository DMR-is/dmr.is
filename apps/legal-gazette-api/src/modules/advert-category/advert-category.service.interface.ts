import {
  GetAdvertCategoriesDto,
  GetAdvertCategoriesQueryDto,
} from './dto/advert-category.dto'

export interface IAdvertCategoryService {
  getCategories(
    query: GetAdvertCategoriesQueryDto,
  ): Promise<GetAdvertCategoriesDto>
}

export const IAdvertCategoryService = Symbol('IAdvertCategoryService')
