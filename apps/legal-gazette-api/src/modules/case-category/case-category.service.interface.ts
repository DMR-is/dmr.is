import {
  GetCaseCategoriesDetailedDto,
  GetCaseCategoriesDto,
} from './dto/case-category.dto'

export interface ICaseCategoryService {
  getCategories(): Promise<GetCaseCategoriesDto>

  getCategoriesDetailed(): Promise<GetCaseCategoriesDetailedDto>
}

export const ICaseCategoryService = Symbol('ICaseCategoryService')
