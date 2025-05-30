import {
  GetCategoriesDetailedDto,
  GetCategoriesDto,
  GetCategoriesQueryDto,
} from './dto/case-category.dto'

export interface ICaseCategoryService {
  getCategories(query: GetCategoriesQueryDto): Promise<GetCategoriesDto>

  getCategoriesDetailed(
    query: GetCategoriesQueryDto,
  ): Promise<GetCategoriesDetailedDto>
}

export const ICaseCategoryService = Symbol('ICaseCategoryService')
