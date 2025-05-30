import { Logger } from 'winston'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import { Inject } from '@nestjs/common'

import { CaseModel } from '../case/models'

export class ExternalServiceMock {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  publishRegulation(publishedCase: CaseModel): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
}
