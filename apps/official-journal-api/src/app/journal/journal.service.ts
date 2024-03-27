import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Inject, Injectable } from '@nestjs/common'
import { IJournalService } from './journal.service.interface'
import {
  Advert,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
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

const LOGGING_CATEGORY = 'JournalService'

@Injectable()
export class JournalService implements IJournalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('JournalService')
  }

  getAdverts(
    params: GetAdvertsQueryParams | undefined,
  ): Promise<GetAdvertsResponse> {
    this.logger.info(params)
    throw new Error('Method not implemented.')
  }

  getDepartments(
    params?: GetDepartmentsQueryParams | undefined,
  ): Promise<GetDepartmentsResponse> {
    this.logger.info('getDepartments', { params })
    throw new Error('Method not implemented.')
  }

  getTypes(
    params?: GetAdvertTypesQueryParams | undefined,
  ): Promise<GetAdvertTypesResponse> {
    this.logger.info('getTypes', { params })
    throw new Error('Method not implemented.')
  }

  getMainCategories(
    params?: GetMainCategoriesQueryParams | undefined,
  ): Promise<GetMainCategoriesResponse> {
    this.logger.info('getMainCategories', { params })
    throw new Error('Method not implemented.')
  }

  getCategories(
    params?: GetCategoriesQueryParams | undefined,
  ): Promise<GetCategoriesResponse> {
    this.logger.info('getCategories', { params })
    throw new Error('Method not implemented.')
  }

  getInvolvedParties(
    params?: GetInvolvedPartiesQueryParams | undefined,
  ): Promise<GetInvolvedPartiesResponse> {
    this.logger.info('getInvolvedParties', { params })
    throw new Error('Method not implemented.')
  }

  getAdvert(): Promise<Advert | null> {
    throw new Error('Method not implemented.')
  }

  submitApplication(
    body: PostApplicationBody,
  ): Promise<PostApplicationResponse> {
    this.logger.info('submitApplication', { body })
    throw new Error('Method not implemented.')
  }

  getSignatures(
    params?: GetAdvertSignatureQuery | undefined,
  ): Promise<GetAdvertSignatureResponse> {
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
