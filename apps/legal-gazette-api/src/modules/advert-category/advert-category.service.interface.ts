import {
  GetAdvertCategoriesDetailedDto,
  GetAdvertCategoriesDto,
  GetAdvertCategoriesQueryDto,
} from './dto/advert-category.dto'

export interface IAdvertCategoryService {
  getCategories(
    query: GetAdvertCategoriesQueryDto,
  ): Promise<GetAdvertCategoriesDto>

  getCategoriesDetailed(
    query: GetAdvertCategoriesQueryDto,
  ): Promise<GetAdvertCategoriesDetailedDto>
}

export const IAdvertCategoryService = Symbol('IAdvertCategoryService')
