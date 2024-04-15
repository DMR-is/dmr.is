import { JournalAdvertsResponse } from '../dto/adverts/journal-advert-responses.dto'
import { JournalAdvert } from '../dto/adverts/journal-advert.dto'
import { JournalGetAdvertsQueryParams } from '../dto/adverts/journal-getadverts-query.dto'
import { JournalGetDepartmentsQueryParams } from '../dto/departments/journal-getdepartments-query.dto'
import { JournalGetTypesQueryParams } from '../dto/types/journal-gettypes-query.dto'
import { JournalAdvertTypesResponse } from '../dto/types/journal-gettypes-response.dto'
import { JournalAdvertDepartmentsResponse } from '../dto/departments/journal-getdepartments-response.dto'
import { JournalGetCategoriesQueryParams } from '../dto/categories/journal-getcategories-query.dto'
import { JournalAdvertCategoriesResponse } from '../dto/categories/journal-getcategories-responses.dto'
import { JournalPostApplicationBody } from '../dto/application/journal-postapplication-body.dto'
import { JournalPostApplicationResponse } from '../dto/application/journal-postapplication-response.dto'

export type ServiceError = {
  message: string
  code: 400 | 404 | 500
}

export type ServiceResult<OkType, ErrorType = ServiceError> =
  | {
      type: 'ok'
      value: OkType
    }
  | {
      type: 'error'
      error: ErrorType
    }

export interface IJournalService {
  getAdverts(
    params?: JournalGetAdvertsQueryParams,
  ): Promise<ServiceResult<JournalAdvertsResponse>>

  getAdvert(id: string): Promise<ServiceResult<JournalAdvert>>

  getDepartments(
    params?: JournalGetDepartmentsQueryParams,
  ): Promise<ServiceResult<JournalAdvertDepartmentsResponse>>

  getTypes(
    params?: JournalGetTypesQueryParams,
  ): Promise<ServiceResult<JournalAdvertTypesResponse>>

  getCategories(
    params?: JournalGetCategoriesQueryParams,
  ): Promise<ServiceResult<JournalAdvertCategoriesResponse>>

  submitApplication(
    body: JournalPostApplicationBody,
  ): Promise<JournalPostApplicationResponse>

  // TODO Testing logging process only, remove later
  error(): void
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
