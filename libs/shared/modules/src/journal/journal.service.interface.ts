import {
  Advert,
  AdvertType,
  Category,
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
} from '@dmr.is/shared/dto'
import { Result } from '@dmr.is/types'

export interface IJournalService {
  getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<Result<GetAdvertsResponse>>
  getAdvert(id: string): Promise<Result<GetAdvertResponse>>
  create(model: Advert): Promise<Result<GetAdvertResponse>>
  updateAdvert(model: Advert): Promise<Result<GetAdvertResponse>>

  getDepartment(id: string): Promise<Result<GetDepartmentResponse>>
  getDepartments(
    params?: DefaultSearchParams,
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
    params?: DefaultSearchParams,
  ): Promise<Result<GetMainCategoriesResponse>>
  insertMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>>
  updateMainCategory(
    model: MainCategory,
  ): Promise<Result<GetMainCategoryResponse>>

  getCategory(id: string): Promise<Result<GetCategoryResponse>>

  getCategories(
    params?: DefaultSearchParams,
  ): Promise<Result<GetCategoriesResponse>>
  insertCategory(model: Category): Promise<Result<GetCategoryResponse>>
  updateCategory(model: Category): Promise<Result<GetCategoryResponse>>

  getInstitution(id: string): Promise<Result<GetInstitutionResponse>>
  getInstitutions(
    params?: DefaultSearchParams,
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
