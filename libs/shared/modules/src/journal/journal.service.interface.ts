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
import { ResultWrapper } from '@dmr.is/types'

export interface IJournalService {
  getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>>
  getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>>
  create(model: Advert): Promise<ResultWrapper<GetAdvertResponse>>
  updateAdvert(model: Advert): Promise<ResultWrapper<GetAdvertResponse>>

  getDepartment(id: string): Promise<ResultWrapper<GetDepartmentResponse>>
  getDepartments(
    params?: GetDepartmentsQueryParams,
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
    params?: GetMainCategoriesQueryParams,
  ): Promise<ResultWrapper<GetMainCategoriesResponse>>
  insertMainCategory(
    model: MainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>>
  updateMainCategory(
    model: MainCategory,
  ): Promise<ResultWrapper<GetMainCategoryResponse>>

  getCategory(id: string): Promise<ResultWrapper<GetCategoryResponse>>
  getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<ResultWrapper<GetCategoriesResponse>>
  insertCategory(model: Category): Promise<ResultWrapper<GetCategoryResponse>>
  updateCategory(model: Category): Promise<ResultWrapper<GetCategoryResponse>>

  getInstitution(id: string): Promise<ResultWrapper<GetInstitutionResponse>>
  getInstitutions(
    params?: GetInstitutionsQueryParams,
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
