import { Transaction } from 'sequelize'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import {
  AdditionTypeEnum,
  CaseAdditionModel,
  CaseAdditionsModel,
} from '@dmr.is/official-journal/models'
import { ResultWrapper } from '@dmr.is/types'

import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { ICaseAdditionService } from './case-addition.service.interface'

@Injectable()
export class CaseAdditionService implements ICaseAdditionService {
  constructor(
    @InjectModel(CaseAdditionModel)
    private caseAdditionModel: typeof CaseAdditionModel,
    @InjectModel(CaseAdditionsModel)
    private readonly caseAdditionsModel: typeof CaseAdditionsModel,
  ) {}

  @LogAndHandle()
  @Transactional()
  async createCaseAddition(
    caseId: string,
    title: string,
    content: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const addition = await this.caseAdditionModel.create(
      {
        title,
        content,
        type: AdditionTypeEnum.Html,
      },
      {
        returning: ['id'],
        transaction,
      },
    )

    await this.caseAdditionsModel.create(
      {
        caseId: caseId,
        additionId: addition.id,
      },
      {
        transaction,
      },
    )

    return ResultWrapper.ok()
  }
}
