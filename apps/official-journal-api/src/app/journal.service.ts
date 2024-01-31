import { CustomLogger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { Inject, Injectable } from '@nestjs/common'
import { JournalAdvert } from '../dto/journal-advert.dto'
import { IJournalService } from './journal.service.interface'
import {
  JournalValidateErrorResponse,
  JournalValidateSuccessResponse,
} from '../dto/journal-advert-responses.dto'

const LOGGING_CATEGORY = 'JournalService'

@Injectable()
export class JournalService implements IJournalService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: CustomLogger) {
    console.log('JournalService')
  }

  getAdvert(): Promise<JournalAdvert | null> {
    throw new Error('Method not implemented.')
  }

  getAdverts(): Promise<Array<JournalAdvert>> {
    return Promise.resolve([])
  }

  validateAdvert(
    advert: JournalAdvert,
  ): Promise<JournalValidateSuccessResponse> {
    throw new Error('Method not implemented.')
  }

  submitAdvert(
    advert: JournalAdvert,
  ): Promise<JournalValidateSuccessResponse | JournalValidateErrorResponse> {
    throw new Error('Method not implemented.')
  }

  error(): void {
    this.logger.warn('about to throw error from service', {
      category: LOGGING_CATEGORY,
    })
    throw new Error('error from service')
  }
}
