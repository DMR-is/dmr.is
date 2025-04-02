import { AddCaseAdvertCorrection } from './dto/advert-correction.dto'

import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'

export interface IAdvertCorrectionService {
  postCaseCorrection(
    caseId: string,
    body: AddCaseAdvertCorrection,
    transaction?: Transaction,
  ): Promise<ResultWrapper>
}

export const IAdvertCorrectionService = Symbol('IAdvertCorrectionService')
