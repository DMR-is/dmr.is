import { Inject, Injectable, NotImplementedException } from '@nestjs/common'
import { ICaseService } from './case.service.interface'
import { LOGGER_PROVIDER, Logger } from '@dmr.is/logging'
import { Case, GetCasesReponse, GetCasesQuery } from '@dmr.is/shared/dto'

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
}
