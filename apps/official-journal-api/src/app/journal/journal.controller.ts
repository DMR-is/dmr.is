import { Route } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IJournalService } from '@dmr.is/modules'
import {
  DefaultSearchParams,
  GetAdvertResponse,
  GetAdvertSignatureQuery,
  GetAdvertSignatureResponse,
  GetAdvertsQueryParams,
  GetAdvertsResponse,
  GetAdvertTypeResponse,
  GetAdvertTypesQueryParams,
  GetAdvertTypesResponse,
  GetCategoriesResponse,
  GetDepartmentResponse,
  GetDepartmentsQueryParams,
  GetDepartmentsResponse,
  GetInstitutionsResponse,
  GetMainCategoriesResponse,
  ValidationResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Controller, Inject, Param, Query } from '@nestjs/common'

const LOGGING_CATEGORY = 'JournalController'

@Controller({
  version: '1',
})
export class JournalController {
  constructor(
    @Inject(IJournalService) private readonly journalService: IJournalService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Route({
    path: '/adverts/:id',
    operationId: 'getAdvertById',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetAdvertResponse,
  })
  async advert(@Param('id') id: string): Promise<GetAdvertResponse> {
    return ResultWrapper.unwrap(await this.journalService.getAdvert(id))
  }

  @Route({
    path: '/adverts',
    operationId: 'getAdverts',
    query: [{ type: GetAdvertsQueryParams, required: false }],
    responseType: GetAdvertsResponse,
  })
  async adverts(
    @Query() params?: GetAdvertsQueryParams,
  ): Promise<GetAdvertsResponse> {
    return ResultWrapper.unwrap(await this.journalService.getAdverts(params))
  }

  @Route({
    path: '/departments/:id',
    operationId: 'getDepartmentById',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetDepartmentResponse,
  })
  async department(@Param('id') id: string): Promise<GetDepartmentResponse> {
    return ResultWrapper.unwrap(await this.journalService.getDepartment(id))
  }

  @Route({
    path: '/departments',
    operationId: 'getDepartments',
    query: [{ type: GetDepartmentsQueryParams, required: false }],
    responseType: GetDepartmentsResponse,
  })
  async departments(
    @Query()
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse> {
    return ResultWrapper.unwrap(
      await this.journalService.getDepartments(params),
    )
  }

  @Route({
    path: '/types/:id',
    operationId: 'getAdvertTypeById',
    params: [{ name: 'id', type: 'string', required: true }],
    responseType: GetAdvertTypeResponse,
  })
  async type(@Param('id') id: string): Promise<GetAdvertTypeResponse> {
    return ResultWrapper.unwrap(await this.journalService.getType(id))
  }

  @Route({
    path: '/types',
    operationId: 'getAdvertTypes',
    query: [{ type: GetAdvertTypesQueryParams, required: false }],
    responseType: GetAdvertTypesResponse,
  })
  async types(
    @Query()
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse> {
    return ResultWrapper.unwrap(await this.journalService.getTypes(params))
  }

  @Route({
    path: '/maincategories',
    operationId: 'getMainCategories',
    query: [{ type: DefaultSearchParams, required: false }],
    responseType: GetMainCategoriesResponse,
  })
  async mainCategories(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetMainCategoriesResponse> {
    return ResultWrapper.unwrap(
      await this.journalService.getMainCategories(params),
    )
  }

  @Route({
    path: '/categories',
    operationId: 'getCategories',
    query: [{ type: DefaultSearchParams, required: false }],
    responseType: GetCategoriesResponse,
  })
  async categories(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetCategoriesResponse> {
    return ResultWrapper.unwrap(await this.journalService.getCategories(params))
  }

  @Route({
    path: '/institutions',
    operationId: 'getInstitutions',
    query: [{ type: DefaultSearchParams, required: false }],
    responseType: GetInstitutionsResponse,
  })
  async institutions(
    @Query()
    params?: DefaultSearchParams,
  ): Promise<GetInstitutionsResponse> {
    return ResultWrapper.unwrap(
      await this.journalService.getInstitutions(params),
    )
  }

  @Route({
    path: '/signatures',
    operationId: 'getSignatures',
    query: [{ type: GetAdvertSignatureQuery, required: false }],
    responseType: GetAdvertSignatureResponse,
  })
  async signatures(
    @Query() params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse> {
    return ResultWrapper.unwrap(await this.journalService.getSignatures(params))
  }

  @Route({
    path: '/error',
    operationId: 'error',
    responseType: ValidationResponse,
  })
  error(): void {
    this.logger.info('Testing to log national id 221101-0101 1212990101')

    this.logger.debug(
      'about to call the error method (this is a debug message)',
      { category: LOGGING_CATEGORY },
    )
    this.logger.warn(
      'about to call the error method (this is a warn message)',
      { category: LOGGING_CATEGORY },
    )

    try {
      this.journalService.error()
    } catch (e) {
      this.logger.error('caught error from service, spreading error message', {
        error: { ...(e as Error) },
        category: LOGGING_CATEGORY,
      })
    }

    this.logger.warn('calling error method without try/catch', {
      category: LOGGING_CATEGORY,
    })
    this.journalService.error()
  }
}
