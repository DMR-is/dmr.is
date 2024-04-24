import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Advert,
  AdvertNotFound,
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
  ValidationResponse,
} from '@dmr.is/shared/dto'

import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Query,
} from '@nestjs/common'
import { ApiNotFoundResponse, ApiQuery, ApiResponse } from '@nestjs/swagger'

import { IJournalService } from './journal.service.interface'

const LOGGING_CATEGORY = 'JournalController'

@Controller({
  version: '1',
})
export class JournalController {
  constructor(
    @Inject(IJournalService) private readonly journalService: IJournalService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('advert')
  @ApiQuery({ name: 'id', type: String, required: true })
  @ApiResponse({
    status: 200,
    type: Advert,
    description: 'Advert by ID.',
  })
  @ApiNotFoundResponse({
    description: 'Advert not found.',
    type: AdvertNotFound,
  })
  async advert(@Query('id') id: string): Promise<Advert | null> {
    const advert = await this.journalService.getAdvert(id)
    if (!advert) {
      this.logger.info('advert not found', {
        category: LOGGING_CATEGORY,
        metadata: { id },
      })
      throw new NotFoundException('advert not found', {
        cause: 'advert not found',
      })
    }

    return advert
  }

  @Get('adverts')
  @ApiResponse({
    status: 200,
    type: GetAdvertsResponse,
    description: 'List of adverts, optional query parameters.',
  })
  @ApiResponse({
    status: 400,
    type: ValidationResponse,
    description: 'Query string validation failed.',
  })
  adverts(
    @Query()
    params?: GetAdvertsQueryParams,
  ): Promise<GetAdvertsResponse> {
    return this.journalService.getAdverts(params)
  }

  @Get('departments')
  @ApiResponse({
    status: 200,
    type: GetDepartmentsResponse,
    description: 'List of departments.',
  })
  @ApiResponse({
    status: 400,
    type: ValidationResponse,
    description: 'Query string validation failed.',
  })
  departments(
    @Query()
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse> {
    return this.journalService.getDepartments(params)
  }

  @Get('types')
  @ApiResponse({
    status: 200,
    type: GetAdvertTypesResponse,
    description: 'List of advert types.',
  })
  @ApiResponse({
    status: 400,
    type: ValidationResponse,
    description: 'Query string validation failed.',
  })
  types(
    @Query()
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse> {
    return this.journalService.getTypes(params)
  }

  @Get('maincategories')
  @ApiResponse({
    status: 200,
    type: GetMainCategoriesResponse,
    description: 'List of main categories.',
  })
  @ApiResponse({
    status: 400,
    type: ValidationResponse,
    description: 'Query string validation failed.',
  })
  mainCategories(
    @Query()
    params?: GetMainCategoriesQueryParams,
  ): Promise<GetMainCategoriesResponse> {
    return this.journalService.getMainCategories(params)
  }

  @Get('categories')
  @ApiResponse({
    status: 200,
    type: GetCategoriesResponse,
    description: 'List of advert categories.',
  })
  @ApiResponse({
    status: 400,
    type: ValidationResponse,
    description: 'Query string validation failed.',
  })
  categories(
    @Query()
    params?: GetCategoriesQueryParams,
  ): Promise<GetCategoriesResponse> {
    return this.journalService.getCategories(params)
  }

  @Get('institutions')
  @ApiResponse({
    status: 200,
    type: GetInstitutionsResponse,
    description: 'List of institutions.',
  })
  @ApiResponse({
    status: 400,
    type: ValidationResponse,
    description: 'Query string validation failed.',
  })
  institutions(
    @Query()
    params?: GetInstitutionsQueryParams,
  ): Promise<GetInstitutionsResponse> {
    return this.journalService.getInstitutions(params)
  }

  @Get('signatures')
  @ApiResponse({
    status: 200,
    type: GetAdvertSignatureResponse,
    description: 'List of signatures',
  })
  signatures(
    @Query() params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse> {
    return this.journalService.getSignatures(params)
  }

  @Get('error')
  @ApiResponse({
    status: 500,
    description: 'Explicit error from service to test logging.',
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
