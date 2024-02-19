import { CustomLogger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger'
import {
  AdvertNotFound,
  JournalAdvertsResponse,
  JournalAdvertsValidationResponse,
} from '../dto/adverts/journal-advert-responses.dto'
import { JournalAdvert } from '../dto/adverts/journal-advert.dto'
import { IJournalService } from './journal.service.interface'
import { JournalGetAdvertsQueryParams } from '../dto/adverts/journal-getadverts-query.dto'
import { JournalGetDepartmentsQueryParams } from '../dto/departments/journal-getdepartments-query.dto'
import { JournalGetTypesQueryParams } from '../dto/types/journal-gettypes-query.dto'
import { JournalAdvertTypesResponse } from '../dto/types/journal-gettypes-response.dto'
import { JournalAdvertDepartmentsResponse } from '../dto/departments/journal-getdepartments-response.dto'
import { JournalGetCategoriesQueryParams } from '../dto/categories/journal-getcategories-query.dto'
import { JournalAdvertCategoriesResponse } from '../dto/categories/journal-getcategories-responses.dto'
import { JournalPostApplicationResponse } from '../dto/application/journal-postapplication-response.dto'
import { JournalPostApplicationBody } from '../dto/application/journal-postapplication-body.dto'
import { JournalSignaturesResponse } from '../dto/signatures/journal-getsignatures-response.dto'
import { JournalGetSignaturesQueryParams } from '../dto/signatures/journal-getsignatures-query.dto'
import { JournalPostSignatureResponse } from '../dto/signatures/journal-postsignature-response.dto'
import { JournalPostSignatureBody } from '../dto/signatures/journal-postsignature-body.dto'

const LOGGING_CATEGORY = 'JournalController'

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
  @ApiResponse({
    status: 200,
    type: JournalAdvert,
    description: 'Journal advert by ID.',
  })
  @ApiNotFoundResponse({
    description: 'Advert not found.',
    type: AdvertNotFound,
  })
  async advert(@Query('id') id: string): Promise<JournalAdvert | null> {
    const advert = await this.journalService.getAdvert(id)
    if (!advert) {
      this.logger.log('advert not found', {
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
    type: JournalAdvertsResponse,
    description: 'List of journal adverts, optional query parameters.',
  })
  @ApiResponse({
    status: 400,
    type: JournalAdvertsValidationResponse,
    description: 'Query string validation failed.',
  })
  adverts(
    @Query()
    params?: JournalGetAdvertsQueryParams,
  ): Promise<JournalAdvertsResponse> {
    return this.journalService.getAdverts(params)
  }

  @Get('departments')
  @ApiResponse({
    status: 200,
    type: JournalAdvertDepartmentsResponse,
    description: 'List of journal advert departments.',
  })
  @ApiResponse({
    status: 400,
    type: JournalAdvertsValidationResponse,
    description: 'Query string validation failed.',
  })
  departments(
    @Query()
    params?: JournalGetDepartmentsQueryParams,
  ): Promise<JournalAdvertDepartmentsResponse> {
    return this.journalService.getDepartments(params)
  }

  @Get('types')
  @ApiResponse({
    status: 200,
    type: JournalAdvertTypesResponse,
    description: 'List of journal advert types.',
  })
  @ApiResponse({
    status: 400,
    type: JournalAdvertsValidationResponse,
    description: 'Query string validation failed.',
  })
  types(
    @Query()
    params?: JournalGetTypesQueryParams,
  ): Promise<JournalAdvertTypesResponse> {
    return this.journalService.getTypes(params)
  }

  @Get('categories')
  @ApiResponse({
    status: 200,
    type: JournalAdvertCategoriesResponse,
    description: 'List of journal advert types.',
  })
  @ApiResponse({
    status: 400,
    type: JournalAdvertsValidationResponse,
    description: 'Query string validation failed.',
  })
  categories(
    @Query()
    params?: JournalGetCategoriesQueryParams,
  ): Promise<JournalAdvertCategoriesResponse> {
    return this.journalService.getCategories(params)
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

  @Get('signatures')
  @ApiResponse({
    status: 200,
    type: JournalSignaturesResponse,
    description: 'List of signatures',
  })
  signatures(
    @Query() params?: JournalGetSignaturesQueryParams,
  ): Promise<JournalSignaturesResponse> {
    return this.journalService.getSignatures(params)
  }

  @Post('signature')
  @ApiResponse({
    status: 200,
    type: JournalPostSignatureResponse,
    description: 'Newly created signature',
  })
  signature(
    @Body() body: JournalPostSignatureBody,
  ): Promise<JournalPostSignatureResponse> {
    return this.journalService.postSignature(body)
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
