import { Transaction } from 'sequelize'
import { DefaultSearchParams } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  CreateMainCategory,
  UpdateCategory,
} from './dto/create-main-category.dto'
import { GetCategoriesResponse } from './dto/get-categories-responses.dto'
import { GetCategoryResponse } from './dto/get-category-responses.dto'
import { GetMainCategoriesResponse } from './dto/get-main-categories-response.dto'
import { GetMainCategoryResponse } from './dto/get-main-category-response.dto'
import { UpdateMainCategory } from './dto/update-main-category.dto'

export interface ICategoryService {
  getMainCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetMainCategoriesResponse>>
  insertMainCategory(
    model: CreateMainCategory,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetMainCategoryResponse>>

  insertMainCategoryCategories(
    mainCategoryId: string,
    categoryIds: string[],
  ): Promise<ResultWrapper>
  updateMainCategory(
    id: string,
    body: UpdateMainCategory,
  ): Promise<ResultWrapper>

  deleteMainCategory(id: string): Promise<ResultWrapper>

  deleteMainCategoryCategory(
    mainCategoryId: string,
    categoryId: string,
  ): Promise<ResultWrapper>

  getCategory(id: string): Promise<ResultWrapper<GetCategoryResponse>>
  getCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetCategoriesResponse>>
  insertCategory(title: string): Promise<ResultWrapper<GetCategoryResponse>>
  deleteCategory(id: string): Promise<ResultWrapper>
  updateCategory(
    id: string,
    model: UpdateCategory,
  ): Promise<ResultWrapper<GetCategoryResponse>>
}

export const ICategoryService = Symbol('ICategoryService')
