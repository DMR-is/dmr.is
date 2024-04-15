import { CustomLogger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger'
import { JournalAdvertsResponse } from '../dto/adverts/journal-advert-responses.dto'
import { JournalAdvert } from '../dto/adverts/journal-advert.dto'
import { IJournalService, ServiceError } from './journal.service.interface'
import { JournalGetAdvertsQueryParams } from '../dto/adverts/journal-getadverts-query.dto'
import { JournalGetDepartmentsQueryParams } from '../dto/departments/journal-getdepartments-query.dto'
import { JournalGetTypesQueryParams } from '../dto/types/journal-gettypes-query.dto'
import { JournalAdvertTypesResponse } from '../dto/types/journal-gettypes-response.dto'
import { JournalAdvertDepartmentsResponse } from '../dto/departments/journal-getdepartments-response.dto'
import { JournalGetCategoriesQueryParams } from '../dto/categories/journal-getcategories-query.dto'
import { JournalAdvertCategoriesResponse } from '../dto/categories/journal-getcategories-responses.dto'
import { JournalPostApplicationResponse } from '../dto/application/journal-postapplication-response.dto'
import { JournalPostApplicationBody } from '../dto/application/journal-postapplication-body.dto'
import { JournalAdvertErrorResponse } from '../dto/journal-errors'

const LOGGING_CATEGORY = 'JournalController'

/**
 * Map a service error to an HTTP exception.
 * @param error Service error to map from.
 * @returns Excpetion to throw.
 */
function mapServerErrorToHttpException(error: ServiceError): HttpException {
  switch (error.code) {
    case 400:
      return new BadRequestException(error.message)
    case 404:
      return new NotFoundException(error.message)
    default:
      return new InternalServerErrorException(error.message)
  }
}

@Controller({
  version: '1',
})
export class JournalController {
  constructor(
    @Inject(IJournalService) private readonly journalService: IJournalService,
    @Inject(LOGGER_PROVIDER) private readonly logger: CustomLogger,
  ) {}

  @Get('advert')
  @ApiQuery({ name: 'id', type: String, required: true })
  @ApiOkResponse({ type: JournalAdvert, description: 'Journal advert by ID.' })
  @ApiNotFoundResponse({
    description: 'Advert not found.',
    type: JournalAdvertErrorResponse,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: JournalAdvertErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    type: JournalAdvertErrorResponse,
  })
  // TODO - add validation for id
  async advert(@Query('id') id: string): Promise<JournalAdvert> {
    const result = await this.journalService.getAdvert(id)
    if (result.type === 'error') {
      throw mapServerErrorToHttpException(result.error)
    }

    return result.value
  }

  @Get('adverts')
  @ApiOkResponse({
    description: 'List of journal adverts.',
    type: JournalAdvertsResponse,
  })
  @ApiNotFoundResponse({
    description: 'Adverts not found.',
    type: JournalAdvertErrorResponse,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: JournalAdvertErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    type: JournalAdvertErrorResponse,
  })
  async adverts(
    @Query()
    params?: JournalGetAdvertsQueryParams,
  ): Promise<JournalAdvertsResponse> {
    const result = await this.journalService.getAdverts(params)

    if (result.type === 'error') {
      throw mapServerErrorToHttpException(result.error)
    }

    return result.value
  }

  @Get('departments')
  @ApiOkResponse({
    description: 'List of journal advert departments.',
    type: JournalAdvertDepartmentsResponse,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: JournalAdvertErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Departments not found.',
    type: JournalAdvertErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    type: JournalAdvertErrorResponse,
  })
  async departments(
    @Query()
    params?: JournalGetDepartmentsQueryParams,
  ): Promise<JournalAdvertDepartmentsResponse> {
    const result = await this.journalService.getDepartments(params)

    if (result.type === 'error') {
      throw mapServerErrorToHttpException(result.error)
    }

    return result.value
  }

  @Get('types')
  @ApiOkResponse({
    description: 'List of journal advert types.',
    type: JournalAdvertTypesResponse,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: JournalAdvertErrorResponse,
  })
  @ApiNotFoundResponse({
    description: 'Types not found.',
    type: JournalAdvertErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    type: JournalAdvertErrorResponse,
  })
  async types(
    @Query()
    params?: JournalGetTypesQueryParams,
  ): Promise<JournalAdvertTypesResponse> {
    this.logger.debug('calling getTypes', {
      params,
      category: LOGGING_CATEGORY,
    })
    const result = await this.journalService.getTypes(params)

    if (result.type === 'error') {
      throw mapServerErrorToHttpException(result.error)
    }

    return result.value
  }

  @Get('categories')
  @ApiOkResponse({
    type: JournalAdvertCategoriesResponse,
    description: 'List of journal advert types.',
  })
  @ApiNotFoundResponse({
    description: 'Categories not found.',
    type: JournalAdvertErrorResponse,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
    type: JournalAdvertErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    type: JournalAdvertErrorResponse,
  })
  async categories(
    @Query()
    params?: JournalGetCategoriesQueryParams,
  ): Promise<JournalAdvertCategoriesResponse> {
    const result = await this.journalService.getCategories(params)

    if (result.type === 'error') {
      throw mapServerErrorToHttpException(result.error)
    }

    return result.value
  }

  @Post('application')
  @ApiResponse({
    status: 200,
    type: JournalPostApplicationResponse,
    description: 'Submit a journal advert application',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed.',
  })
  application(
    @Body() application: JournalPostApplicationBody,
  ): Promise<JournalPostApplicationResponse> {
    return this.journalService.submitApplication(application)
  }

  @Get('error')
  @ApiResponse({
    status: 500,
    description: 'Explicit error from service to test logging.',
  })
  error(): void {
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

  @Get('health')
  @ApiResponse({
    status: 200,
    description: 'Health check endpoint.',
  })
  health(): Promise<string> {
    return Promise.resolve('OK')
  }
}
