import { Inject, Injectable, NotImplementedException } from '@nestjs/common'
import { ICaseService } from './case.service.interface'
import { Case } from '../../dto/case/case.dto'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { CasesReponse } from '../../dto/case/cases-response'
import { CasesQuery } from '../../dto/case/cases-query.dto'

@Injectable()
export class CaseService implements ICaseService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('CaseService')
  }
  getCase(id: string): Promise<Case | null> {
    this.logger.info(id)
    throw new NotImplementedException()
  }

  getCases(params?: CasesQuery): Promise<CasesReponse> {
    this.logger.info(params)
    throw new NotImplementedException()
  }
}
