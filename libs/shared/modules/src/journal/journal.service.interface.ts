import {
  Advert,
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
  getAdverts(params?: GetAdvertsQueryParams): Promise<GetAdvertsResponse>

  getAdvert(id: string): Promise<Advert | null>

  getDepartment(id: string): Promise<GetDepartmentResponse>

  getDepartments(
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse>

  getTypes(params?: GetAdvertTypesQueryParams): Promise<GetAdvertTypesResponse>

  getMainCategories(
    params?: GetMainCategoriesQueryParams,
  ): Promise<GetMainCategoriesResponse>

  getCategories(
    params?: GetCategoriesQueryParams,
  ): Promise<GetCategoriesResponse>

  getInstitution(id: string): Promise<GetInstitutionResponse>

  getInstitutions(
    params?: GetInstitutionsQueryParams,
  ): Promise<GetInstitutionsResponse>

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
