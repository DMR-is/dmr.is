import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LogAndHandle } from '@dmr.is/decorators'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { GetCasesQuery, GetCasesReponse } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils-server/serverUtils'

import { caseMigrate } from '../migrations/case.migrate'
import { CaseModel } from '../models'
import { ICaseListService } from './case-list.service.interface'
import { findCases } from './find-cases.query'

@Injectable()
export class CaseListService implements ICaseListService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}

  @LogAndHandle()
  async getCases(
    params: GetCasesQuery,
  ): Promise<ResultWrapper<GetCasesReponse>> {
    const cases = await findCases(this.caseModel, params, this.logger)
    const mapped = cases.rows.map((c) => caseMigrate(c))

    return ResultWrapper.ok({
      cases: mapped,
      paging: generatePaging(mapped, params.page, params.pageSize, cases.count),
    })
  }
}
