import {
  Advert,
  AdvertType,
  Category,
  Department,
  GetAdvertResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetAdvertTypeResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCategoriesQueryParams,
  GetCategoriesResponse,
  GetCategoryResponse,
  GetDepartmentResponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInstitutionResponse,
  GetInstitutionsQueryParams,
  GetInstitutionsResponse,
  GetMainCategoriesQueryParams,
  GetMainCategoriesResponse,
  GetMainCategoryResponse,
  Institution,
  MainCategory,
} from '@dmr.is/shared/dto'

import { Result } from '../types/result'

export interface IJournalService {
  getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<Result<GetAdvertsResponse>>
  getAdvert(id: string): Promise<Result<GetAdvertResponse>>
  insertAdvert(model: Advert): Promise<Result<GetAdvertResponse>>
  updateAdvert(model: Advert): Promise<Result<GetAdvertResponse>>

  getDepartment(id: string): Promise<Result<GetDepartmentResponse>>
  getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<Result<GetDepartmentsResponse>>
  insertDepartment(model: Department): Promise<Result<GetDepartmentResponse>>
  updateDepartment(model: Department): Promise<Result<GetDepartmentResponse>>

  getType(id: string): Promise<Result<GetAdvertTypeResponse>>

  getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<Result<GetAdvertTypesResponse>>
  getType(id: string): Promise<Result<GetAdvertTypeResponse>>
  insertType(model: AdvertType): Promise<Result<GetAdvertTypeResponse>>
  updateType(model: AdvertType): Promise<Result<GetAdvertTypeResponse>>
  getMainCategories(
    params?: GetMainCategoriesQueryParams,
  ): Promise<Result<GetMainCategoriesResponse>>
  insertMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>>
  updateMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>>

  getCategory(id: string): Promise<Result<GetCategoryResponse>>

  getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<Result<GetCategoriesResponse>>
  insertCategory(model: Category): Promise<Result<GetCategoryResponse>>
  updateCategory(model: Category): Promise<Result<GetCategoryResponse>>

  getInstitution(id: string): Promise<Result<GetInstitutionResponse>>
  getInstitutions(
    params?: GetInstitutionsQueryParams,
  ): Promise<Result<GetInstitutionsResponse>>
  insertInstitution(model: Institution): Promise<Result<GetInstitutionResponse>>
  updateInstitution(model: Institution): Promise<Result<GetInstitutionResponse>>

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<Result<GetAdvertSignatureResponse>>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
