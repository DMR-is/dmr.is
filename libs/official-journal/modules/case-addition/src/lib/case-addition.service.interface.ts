import { ResultWrapper } from '@dmr.is/types'
import { Transaction } from 'sequelize'

export interface ICaseAdditionService {
  createCaseAddition(
    caseId: string,
    title: string,
    content: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const ICaseAdditionService = Symbol('ICaseAdditionService')
