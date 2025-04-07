import { Transaction } from 'sequelize'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { CaseHistoryModel, CaseModel } from '@dmr.is/official-journal/models'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

const LOGGING_CATEGORY = 'case-history-service'
const LOGGING_CONTEXT = 'CaseHistoryService'

@Injectable()
export class CaseHistoryService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(CaseHistoryModel)
    private readonly caseHistoryModel: typeof CaseHistoryModel,
  ) {}

  @LogAndHandle()
  @Transactional()
  async createCaseHistory(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const now = new Date().toISOString()
    const caseLookup = await this.caseModel.findByPk(caseId, {
      attributes: [
        'id',
        'departmentId',
        'statusId',
        'advertTypeId',
        'involvedPartyId',
        'assignedUserId',
        'advertTitle',
        'html',
        'requestedPublicationDate',
      ],
      transaction,
    })

    if (caseLookup === null) {
      this.logger.warn(`Tried to create case history, but case is not found`, {
        caseId,
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
      })
      return ResultWrapper.err({
        code: 404,
        message: 'Case not found',
      })
    }
    await this.caseHistoryModel.create(
      {
        caseId: caseLookup.id,
        departmentId: caseLookup.departmentId,
        typeId: caseLookup.advertTypeId,
        statusId: caseLookup.statusId,
        involvedPartyId: caseLookup.involvedPartyId,
        userId: caseLookup.assignedUserId,
        title: caseLookup.advertTitle,
        html: caseLookup.html,
        requestedPublicationDate: new Date(
          caseLookup.requestedPublicationDate,
        ).toISOString(),
      },
      { transaction },
    )

    return ResultWrapper.ok()
  }
}
