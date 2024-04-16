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

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

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
    const token = await this.authService.getAccessToken()

    this.logger.info('token', { token })

    this.logger.info('fetching application', { id })
    const application = await fetch(
      `http://127.0.0.1:8000/r1/IS-DEV/GOV/10000/island-is/application-callback-v2/applications/${id}`,
      {
        method: 'GET',
        headers: {
          'X-Road-Client': 'IS-DEV/GOV/10014/DMR-Client',
          Authorization: `Bearer ${token}`,
        },
      },
    )
      .then((res) => res.json())
      .catch((err) => {
        this.logger.error('error fetching application', { id, err })
        throw new InternalServerErrorException()
      })

    return Promise.resolve(application as Advert)
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
