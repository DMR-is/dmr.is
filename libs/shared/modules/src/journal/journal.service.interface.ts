import { Transaction } from 'sequelize'
import {
  Advert,
  AdvertType,
  Category,
  CreateAdvert,
  DefaultSearchParams,
  Department,
  GetAdvertResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetAdvertTypeResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCategoriesResponse,
  GetCategoryResponse,
  GetDepartmentResponse,
  GetDepartmentsResponse,
  GetInstitutionResponse,
  GetInstitutionsResponse,
  GetMainCategoriesResponse,
  GetMainCategoryResponse,
  Institution,
  MainCategory,
  UpdateAdvertBody,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IJournalService {
  getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>>
  getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>>
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

  getType(id: string): Promise<ResultWrapper<GetAdvertTypeResponse>>
  getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<ResultWrapper<GetAdvertTypesResponse>>
  insertType(model: AdvertType): Promise<ResultWrapper<GetAdvertTypeResponse>>
  updateType(model: AdvertType): Promise<ResultWrapper<GetAdvertTypeResponse>>

  getMainCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetMainCategoriesResponse>>
  insertMainCategory(
    model: MainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>>
  updateMainCategory(
    model: MainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>>

  getCategory(id: string): Promise<ResultWrapper<GetCategoryResponse>>
  getCategories(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetCategoriesResponse>>
  insertCategory(model: Category): Promise<ResultWrapper<GetCategoryResponse>>
  updateCategory(model: Category): Promise<ResultWrapper<GetCategoryResponse>>

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
