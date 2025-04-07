import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseHistoryService {
  createCaseHistory(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICaseHistoryService = Symbol('ICaseHistoryService')
