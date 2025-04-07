import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseAdditionService {
  createCaseAddition(
    caseId: string,
    title: string,
    content: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICaseAdditionService = Symbol('ICaseAdditionService')
