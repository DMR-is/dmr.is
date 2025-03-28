import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'
import {
  GetInstitutionResponse,
  GetInstitutionsResponse,
  Institution,
} from '@dmr.is/official-journal/modules/institution'
import { CreateAdvert } from './dto/advert.dto'
import {
  CreateMainCategory,
  UpdateCategory,
} from './dto/create-main-category.dto'
import { DefaultSearchParams } from './dto/default-search-params.dto'
import { Department } from './dto/department.dto'
import { GetAdvertResponse } from './dto/get-advert-response.dto'
import { GetAdvertSignatureQuery } from './dto/get-advert-signature-query.dto'
import { GetAdvertSignatureResponse } from './dto/get-advert-signature-response.dto'
import { GetAdvertsQueryParams } from './dto/get-adverts-query.dto'
import {
  GetAdvertsResponse,
  GetSimilarAdvertsResponse,
} from './dto/get-adverts-responses.dto'
import { GetCategoriesResponse } from './dto/get-categories-responses.dto'
import { GetCategoryResponse } from './dto/get-category-responses.dto'
import { GetDepartmentResponse } from './dto/get-department-response.dto'
import { GetDepartmentsResponse } from './dto/get-departments-response.dto'
import { GetMainCategoriesResponse } from './dto/get-main-categories-response.dto'
import { GetMainCategoryResponse } from './dto/get-main-category-response.dto'
import { UpdateAdvertBody } from './dto/update-advert-body.dto'
import { UpdateMainCategory } from './dto/update-main-category.dto'

export interface IJournalService {
  getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>>
  getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>>
  getSimilarAdverts(
    advertId: string,
    limit?: number,
  ): Promise<ResultWrapper<GetSimilarAdvertsResponse>>
  create(
    model: CreateAdvert,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertResponse>>
  updateAdvert(
    advertId: string,
    body: UpdateAdvertBody,
  ): Promise<ResultWrapper<GetAdvertResponse>>

  getDepartment(id: string): Promise<ResultWrapper<GetDepartmentResponse>>
  getDepartments(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetDepartmentsResponse>>
  insertDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>>
  updateDepartment(
    model: Department,
  ): Promise<ResultWrapper<GetDepartmentResponse>>

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

  getInstitution(id: string): Promise<ResultWrapper<GetInstitutionResponse>>
  getInstitutions(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetInstitutionsResponse>>
  insertInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>>
  updateInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>>

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<ResultWrapper<GetAdvertSignatureResponse>>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
