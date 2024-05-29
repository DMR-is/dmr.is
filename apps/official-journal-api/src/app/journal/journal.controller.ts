import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IJournalService } from '@dmr.is/modules'
import {
  Advert,
  AdvertNotFound,
  GetAdvertResponse,
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
  HttpException,
  Inject,
  Param,
  Query,
} from '@nestjs/common'
import {
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger'

const LOGGING_CATEGORY = 'JournalController'

@Controller({
  version: '1',
})
export class JournalController {
  constructor(
    @Inject(IJournalService) private readonly journalService: IJournalService,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('adverts/:id')
  @ApiResponse({
    status: 200,
    type: GetAdvertResponse,
    description: 'Advert by ID.',
  })
  @ApiNotFoundResponse({
    description: 'Advert not found.',
    type: AdvertNotFound,
  })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Advert ID.',
  })
  async advert(@Param('id') id: string): Promise<GetAdvertResponse> {
    const result = await this.journalService.getAdvert(id)

    if (!result.ok) {
      throw new HttpException(result.error, result.error.code)
    }

    return Promise.resolve({
      ...result.value,
    })
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
  @ApiQuery({
    type: GetAdvertsQueryParams,
    required: false,
    name: 'params'
  })
  async adverts(
    @Query('params') params?: GetAdvertsQueryParams): Promise<GetAdvertsResponse> {
    const result = await this.journalService.getAdverts(params)

    if (!result.ok) {
      throw new HttpException(result.error, result.error.code)
    }

    return Promise.resolve({
      ...result.value,
    })
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
  async departments(
    @Query()
    params?: GetDepartmentsQueryParams,
  ): Promise<GetDepartmentsResponse> {
    const result = await this.journalService.getDepartments(params)

    if (!result.ok) {
      throw new HttpException(result.error, result.error.code)
    }

    return Promise.resolve({
      ...result.value,
    })
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
  async types(
    @Query()
    params?: GetAdvertTypesQueryParams,
  ): Promise<GetAdvertTypesResponse> {
    const result = await this.journalService.getTypes(params)

    if (!result.ok) {
      throw new HttpException(result.error, result.error.code)
    }

    return Promise.resolve({
      ...result.value,
    })
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
  async mainCategories(
    @Query()
    params?: GetMainCategoriesQueryParams,
  ): Promise<GetMainCategoriesResponse> {
    const result = await this.journalService.getMainCategories(params)

    if (!result.ok) {
      throw new HttpException(result.error, result.error.code)
    }

    return Promise.resolve({
      ...result.value,
    })
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
  async categories(
    @Query()
    params?: GetCategoriesQueryParams,
  ): Promise<GetCategoriesResponse> {
    const result = await this.journalService.getCategories(params)

    if (!result.ok) {
      throw new HttpException(result.error, result.error.code)
    }

    return Promise.resolve({
      ...result.value,
    })
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
  async institutions(
    @Query()
    params?: GetInstitutionsQueryParams,
  ): Promise<GetInstitutionsResponse> {
    const result = await this.journalService.getInstitutions(params)

    if (!result.ok) {
      throw new HttpException(result.error, result.error.code)
    }

    return Promise.resolve({
      ...result.value,
    })
  }

  @Get('signatures')
  @ApiResponse({
    status: 200,
    type: GetAdvertSignatureResponse,
    description: 'List of signatures',
  })
  @ApiResponse({
    status: 400,
    type: ValidationResponse,
    description: 'Query string validation failed.',
  })
  async signatures(
    @Query() params?: GetAdvertSignatureQuery,
  ): Promise<GetAdvertSignatureResponse> {
    const result = await this.journalService.getSignatures(params)

    if (!result.ok) {
      throw new HttpException(result.error, result.error.code)
    }

    return Promise.resolve({
      ...result.value,
    })
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
