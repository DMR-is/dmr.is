import {
  Advert,
  AdvertType,
  Category,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCategoriesQueryParams,
  GetCategoriesResponse,
  GetDepartmentResponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInstitutionResponse,
  GetInstitutionsQueryParams,
  GetInstitutionsResponse,
  GetMainCategoriesQueryParams,
  GetMainCategoriesResponse,
} from '@dmr.is/shared/dto'

export interface IJournalService {
  getAdverts(params?: GetAdvertsQueryParams): Promise<GetAdvertsResponse | null>

  getAdvert(id: string): Promise<Advert | null>

  getDepartment(id: string): Promise<GetDepartmentResponse | null>

  getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse | null>

  getType(id: string): Promise<AdvertType | null>

  getTypes(
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse | null>

  getMainCategories(
    params?: GetMainCategoriesQueryParams,
  ): Promise<GetMainCategoriesResponse | null>

  getCategory(id: string): Promise<Category | null>

  getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<GetCategoriesResponse | null>

  getInstitution(id: string): Promise<GetInstitutionResponse | null>

  getInstitutions(
    params?: GetInstitutionsQueryParams,
  ): Promise<GetInstitutionsResponse | null>

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse | null>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
