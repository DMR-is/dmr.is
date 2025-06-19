import { GetCategoriesDto, GetCategoriesQueryDto } from './dto/category.dto'

export interface ICategoryService {
  getCategories(query: GetCategoriesQueryDto): Promise<GetCategoriesDto>
}

export const ICategoryService = Symbol('ICategoryService')
