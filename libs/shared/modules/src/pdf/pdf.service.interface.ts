import { ResultWrapper } from '@dmr.is/types'

export interface IPdfService {
  getPdfByCaseId(caseId: string): Promise<ResultWrapper<Buffer>>

  getPdfByApplicationId(applicationId: string): Promise<ResultWrapper<Buffer>>
}

export const IPdfService = Symbol('IPdfService')
