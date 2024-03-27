import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  Case,
  CaseEditorialOverview,
  GetCasesQuery,
  GetCasesReponse,
} from '@dmr.is/shared/dto'

import { Inject, Injectable, NotImplementedException } from '@nestjs/common'

import { ICaseService } from './case.service.interface'

@Injectable()
export class CaseService implements ICaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('CaseService')
  }
  getCase(id: string): Promise<Case | null> {
    this.logger.info(id)
    throw new NotImplementedException()
  }

  getCases(params?: GetCasesQuery): Promise<GetCasesReponse> {
    this.logger.info(params)
    throw new NotImplementedException()
  }

  getEditorialOverview(params: GetCasesQuery): Promise<CaseEditorialOverview> {
    this.logger.info(params)
    throw new NotImplementedException()
  }
}
