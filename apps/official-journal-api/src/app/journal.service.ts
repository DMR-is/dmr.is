import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Inject, Injectable } from '@nestjs/common'
import { JournalAdvert } from '../dto/adverts/journal-advert.dto'
import { IJournalService } from './journal.service.interface'
import { JournalAdvertsResponse } from '../dto/adverts/journal-advert-responses.dto'
import { JournalGetAdvertsQueryParams } from '../dto/adverts/journal-getadverts-query.dto'
import { JournalGetTypesQueryParams } from '../dto/types/journal-gettypes-query.dto'
import { JournalGetDepartmentsQueryParams } from '../dto/departments/journal-getdepartments-query.dto'
import { JournalAdvertDepartmentsResponse } from '../dto/departments/journal-getdepartments-response.dto'
import { JournalAdvertTypesResponse } from '../dto/types/journal-gettypes-response.dto'
import { JournalGetCategoriesQueryParams } from '../dto/categories/journal-getcategories-query.dto'
import { JournalAdvertCategoriesResponse } from '../dto/categories/journal-getcategories-responses.dto'
import { JournalPostApplicationBody } from '../dto/application/journal-postapplication-body.dto'
import { JournalPostApplicationResponse } from '../dto/application/journal-postapplication-response.dto'

const LOGGING_CATEGORY = 'JournalService'

@Injectable()
export class JournalService implements IJournalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('JournalService')
  }

  getAdverts(
    params: JournalGetAdvertsQueryParams | undefined,
  ): Promise<JournalAdvertsResponse> {
    console.log(params)
    throw new Error('Method not implemented.')
  }

  getDepartments(
    params?: JournalGetDepartmentsQueryParams | undefined,
  ): Promise<JournalAdvertDepartmentsResponse> {
    this.logger.log('getDepartments', { params })
    throw new Error('Method not implemented.')
  }

  getTypes(
    params?: JournalGetTypesQueryParams | undefined,
  ): Promise<JournalAdvertTypesResponse> {
    this.logger.log('getTypes', { params })
    throw new Error('Method not implemented.')
  }

  getCategories(
    params?: JournalGetCategoriesQueryParams | undefined,
  ): Promise<JournalAdvertCategoriesResponse> {
    this.logger.log('getCategories', { params })
    throw new Error('Method not implemented.')
  }

  getAdvert(): Promise<JournalAdvert | null> {
    throw new Error('Method not implemented.')
  }

  submitApplication(
    body: JournalPostApplicationBody,
  ): Promise<JournalPostApplicationResponse> {
    this.logger.log('submitApplication', { body })
    throw new Error('Method not implemented.')
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }
}
