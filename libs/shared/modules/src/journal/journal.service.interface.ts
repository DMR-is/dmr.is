import {
  Advert,
  AdvertType,
  Category,
  Department,
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

export interface IJournalService {
  getAdverts(params?: GetAdvertsQueryParams): Promise<GetAdvertsResponse | null>
  getAdvert(id: string): Promise<Advert | null>
  insertAdvert(model: Advert): Promise<Advert | null>
  updateAdvert(model: Advert): Promise<Advert | null>

  getDepartment(id: string): Promise<GetDepartmentResponse | null>
  getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse | null>
  insertDepartment(model: Department): Promise<GetDepartmentResponse | null>
  updateDepartment(model: Department): Promise<GetDepartmentResponse | null>

  getType(id: string): Promise<AdvertType | null>

  getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse | null>
  getType(id: string): Promise<GetAdvertTypeResponse | null>
  insertType(model: AdvertType): Promise<GetAdvertTypeResponse | null>
  updateType(model: AdvertType): Promise<GetAdvertTypeResponse | null>

  getMainCategories(
    params?: GetMainCategoriesQueryParams,
  ): Promise<GetMainCategoriesResponse | null>
  insertMainCategory(
    model: MainCategory,
  ): Promise<GetMainCategoryResponse | null>
  updateMainCategory(
    model: MainCategory,
  ): Promise<GetMainCategoryResponse | null>

  getCategory(id: string): Promise<Category | null>

  getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<GetCategoriesResponse | null>
  insertCategory(model: Category): Promise<GetCategoryResponse | null>
  updateCategory(model: Category): Promise<GetCategoryResponse | null>

  getInstitution(id: string): Promise<GetInstitutionResponse | null>
  getInstitutions(
    params?: GetInstitutionsQueryParams,
  ): Promise<GetInstitutionsResponse | null>
  insertInstitution(model: Institution): Promise<GetInstitutionResponse | null>
  updateInstitution(model: Institution): Promise<GetInstitutionResponse | null>

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse | null>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
