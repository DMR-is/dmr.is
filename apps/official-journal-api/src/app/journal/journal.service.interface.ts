import {
  Advert,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetCategoriesQueryParams,
  GetCategoriesResponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInvolvedPartiesQueryParams,
  GetInvolvedPartiesResponse,
  GetMainCategoriesQueryParams,
  GetMainCategoriesResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  PostApplicationBody,
  PostApplicationResponse,
} from '@dmr.is/shared/dto'

export interface IJournalService {
  getAdverts(params?: GetAdvertsQueryParams): Promise<GetAdvertsResponse>

  getAdvert(id: string): Promise<Advert | null>

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

  getInvolvedParties(
    params?: GetInvolvedPartiesQueryParams,
  ): Promise<GetInvolvedPartiesResponse>

  submitApplication(body: PostApplicationBody): Promise<PostApplicationResponse>

  getSignatures(
    params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
