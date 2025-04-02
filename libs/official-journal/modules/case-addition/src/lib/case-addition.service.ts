import { Injectable } from '@nestjs/common'
import { ICaseAdditionService } from './case-addition.service.interface'
import { ResultWrapper } from '@dmr.is/types'
import { Transaction } from 'sequelize'
import { InjectModel } from '@nestjs/sequelize'
import {
  AdditionTypeEnum,
  CaseAdditionModel,
  CaseAdditionsModel,
} from '@dmr.is/official-journal/models'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'

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
