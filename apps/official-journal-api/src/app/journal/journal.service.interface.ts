import { JournalAdvertsResponse } from '../../dto/adverts/journal-advert-responses.dto'
import { JournalAdvert } from '../../dto/adverts/journal-advert.dto'
import { JournalGetAdvertsQueryParams } from '../../dto/adverts/journal-getadverts-query.dto'
import { JournalGetDepartmentsQueryParams } from '../../dto/departments/journal-getdepartments-query.dto'
import { JournalGetTypesQueryParams } from '../../dto/types/journal-gettypes-query.dto'
import { JournalAdvertTypesResponse } from '../../dto/types/journal-gettypes-response.dto'
import { JournalAdvertDepartmentsResponse } from '../../dto/departments/journal-getdepartments-response.dto'
import { JournalGetCategoriesQueryParams } from '../../dto/categories/journal-getcategories-query.dto'
import { JournalAdvertCategoriesResponse } from '../../dto/categories/journal-getcategories-responses.dto'
import { JournalPostApplicationBody } from '../../dto/application/journal-postapplication-body.dto'
import { JournalPostApplicationResponse } from '../../dto/application/journal-postapplication-response.dto'
import { JournalSignatureQuery } from '../../dto/signatures/journal-signature-query.dto'
import { JournalSignatureGetResponse } from '../../dto/signatures/journal-signature-get-response.dto'

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

  getCategories(
    params?: JournalGetCategoriesQueryParams,
  ): Promise<JournalAdvertCategoriesResponse>

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