import {
  GetCaseCategoriesDetailedDto,
  GetCaseCategoriesDto,
  GetCaseCategoriesQueryDto,
} from './dto/case-category.dto'

export interface ICaseCategoryService {
  getCategories(query: GetCaseCategoriesQueryDto): Promise<GetCaseCategoriesDto>

  getCategoriesDetailed(
    query: GetCaseCategoriesQueryDto,
  ): Promise<GetCaseCategoriesDetailedDto>
}

export const ICaseCategoryService = Symbol('ICaseCategoryService')
