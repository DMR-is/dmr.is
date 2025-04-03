import { ResultWrapper } from '@dmr.is/types'
import { Transaction } from 'sequelize'

export interface ICaseHistoryService {
  createCaseHistory(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICaseHistoryService = Symbol('ICaseHistoryService')
