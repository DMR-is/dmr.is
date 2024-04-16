import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
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
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInstitutionsQueryParams,
  GetInstitutionsResponse,
  GetMainCategoriesQueryParams,
  GetMainCategoriesResponse,
  PostApplicationBody,
  PostApplicationResponse,
} from '@dmr.is/shared/dto'

import { Inject, Injectable } from '@nestjs/common'

import { AuthService } from '../auth/auth.service'
import { IJournalService } from './journal.service.interface'

const LOGGING_CATEGORY = 'JournalService'

@Injectable()
export class JournalService implements IJournalService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly authService: AuthService,
  ) {
    this.logger.info('Using journal service')
  }

  async getAdvert(id: string): Promise<Advert | null> {
    this.logger.info('getAdvert', { id })
    throw new Error('Method not implemented.')
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

  getInstitutions(
    params?: GetInstitutionsQueryParams | undefined,
  ): Promise<GetInstitutionsResponse> {
    this.logger.info('getInstitutions', { params })
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
