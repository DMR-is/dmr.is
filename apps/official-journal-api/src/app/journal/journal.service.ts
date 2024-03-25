import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Inject, Injectable } from '@nestjs/common'
import { IJournalService } from './journal.service.interface'
import {
  JournalGetAdvertsQueryParams,
  JournalAdvertsResponse,
  JournalGetDepartmentsQueryParams,
  JournalAdvertDepartmentsResponse,
  JournalGetTypesQueryParams,
  JournalAdvertTypesResponse,
  JournalGetMainCategoriesQueryParams,
  JournalAdvertMainCategoriesResponse,
  JournalGetCategoriesQueryParams,
  JournalAdvertCategoriesResponse,
  JournalGetInvolvedPartiesQueryParams,
  JournalAdvertInvolvedPartiesResponse,
  JournalAdvert,
  JournalPostApplicationBody,
  JournalPostApplicationResponse,
  JournalSignatureQuery,
  JournalSignatureGetResponse,
} from '@dmr.is/shared/dto/journal'

const LOGGING_CATEGORY = 'JournalService'

@Injectable()
export class JournalService implements IJournalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('JournalService')
  }

  getAdverts(
    params: JournalGetAdvertsQueryParams | undefined,
  ): Promise<JournalAdvertsResponse> {
    this.logger.info(params)
    throw new Error('Method not implemented.')
  }

  getDepartments(
    params?: JournalGetDepartmentsQueryParams | undefined,
  ): Promise<JournalAdvertDepartmentsResponse> {
    this.logger.info('getDepartments', { params })
    throw new Error('Method not implemented.')
  }

  getTypes(
    params?: JournalGetTypesQueryParams | undefined,
  ): Promise<JournalAdvertTypesResponse> {
    this.logger.info('getTypes', { params })
    throw new Error('Method not implemented.')
  }

  getMainCategories(
    params?: JournalGetMainCategoriesQueryParams | undefined,
  ): Promise<JournalAdvertMainCategoriesResponse> {
    this.logger.info('getMainCategories', { params })
    throw new Error('Method not implemented.')
  }

  getCategories(
    params?: JournalGetCategoriesQueryParams | undefined,
  ): Promise<JournalAdvertCategoriesResponse> {
    this.logger.info('getCategories', { params })
    throw new Error('Method not implemented.')
  }

  getInvolvedParties(
    params?: JournalGetInvolvedPartiesQueryParams | undefined,
  ): Promise<JournalAdvertInvolvedPartiesResponse> {
    this.logger.info('getInvolvedParties', { params })
    throw new Error('Method not implemented.')
  }

  getAdvert(): Promise<JournalAdvert | null> {
    throw new Error('Method not implemented.')
  }

  submitApplication(
    body: JournalPostApplicationBody,
  ): Promise<JournalPostApplicationResponse> {
    this.logger.info('submitApplication', { body })
    throw new Error('Method not implemented.')
  }

  getSignatures(
    params?: JournalSignatureQuery | undefined,
  ): Promise<JournalSignatureGetResponse> {
    this.logger.info('getSignatures', { params })
    throw new Error('Method not implemented.')
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }
}
