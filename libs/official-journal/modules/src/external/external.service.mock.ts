/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from 'winston'

import { Inject } from '@nestjs/common'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import { CaseModel } from '../case/models'

export class ExternalServiceMock {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using CaseServiceMock')
  }
  publishRegulation(publishedCase: CaseModel): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
}
