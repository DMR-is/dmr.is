import {
  JournalAdvert,
  JournalAdvertCategoriesResponse,
  JournalAdvertDepartmentsResponse,
  JournalAdvertInvolvedPartiesResponse,
  JournalAdvertMainCategoriesResponse,
  JournalAdvertTypesResponse,
  JournalAdvertsResponse,
  JournalGetAdvertsQueryParams,
  JournalGetCategoriesQueryParams,
  JournalGetDepartmentsQueryParams,
  JournalGetInvolvedPartiesQueryParams,
  JournalGetMainCategoriesQueryParams,
  JournalGetTypesQueryParams,
  JournalPostApplicationBody,
  JournalPostApplicationResponse,
  JournalSignatureGetResponse,
  JournalSignatureQuery,
} from '@dmr.is/shared/dto/journal'

export interface IJournalService {
  getAdverts(
    params?: JournalGetAdvertsQueryParams,
  ): Promise<JournalAdvertsResponse>

  getAdvert(id: string): Promise<JournalAdvert | null>

  getDepartments(
    params?: JournalGetDepartmentsQueryParams,
  ): Promise<JournalAdvertDepartmentsResponse>

  getTypes(
    params?: JournalGetTypesQueryParams,
  ): Promise<JournalAdvertTypesResponse>

  getMainCategories(
    params?: JournalGetMainCategoriesQueryParams,
  ): Promise<JournalAdvertMainCategoriesResponse>

  getCategories(
    params?: JournalGetCategoriesQueryParams,
  ): Promise<JournalAdvertCategoriesResponse>

  getInvolvedParties(
    params?: JournalGetInvolvedPartiesQueryParams,
  ): Promise<JournalAdvertInvolvedPartiesResponse>

  submitApplication(
    body: JournalPostApplicationBody,
  ): Promise<JournalPostApplicationResponse>

  getSignatures(
    params?: JournalSignatureQuery,
  ): Promise<JournalSignatureGetResponse>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
