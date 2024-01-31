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
  ApiBody,
  ApiNotFoundResponse,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger'
import {
  AdvertNotFound,
  JournalValidateSuccessResponse,
  JournalAdvertsResponse,
  JournalValidateErrorResponse,
} from '../dto/journal-advert-responses.dto'
import { JournalAdvert } from '../dto/journal-advert.dto'
import { IJournalService } from './journal.service.interface'

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
      throw new NotFoundException('Advert not found', {
        cause: 'advert not found',
      })
    }

    return advert
  }

  @Get('adverts')
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiResponse({
    status: 200,
    type: JournalAdvertsResponse,
    description: 'List of journal adverts, optional query parameters.',
  })
  adverts(
    @Query('search')
    search?: string,
  ): Promise<Array<JournalAdvert>> {
    return this.journalService.getAdverts({ search })
  }

  @Get('validate')
  @ApiResponse({
    status: 200,
    type: JournalValidateSuccessResponse,
    description: 'Validation success',
  })
  @ApiResponse({
    status: 400,
    type: JournalValidateErrorResponse,
    description: 'Validation failed',
  })
  @ApiBody({ type: JournalAdvert })
  validate(
    @Body('input') input: JournalAdvert,
  ): Promise<JournalValidateSuccessResponse | JournalValidateErrorResponse> {
    return this.journalService.validateAdvert(input)
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
    this.logger.log(
      'called error method without try/catch, this should not be logged',
      { category: LOGGING_CATEGORY },
    )
  }

  @Get('health')
  @ApiResponse({
    status: 200,
    description: 'Health check endpoint.',
  })
  health(): string {
    return 'OK'
  }
}
