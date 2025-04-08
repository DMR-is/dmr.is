import { ResultWrapper } from '@dmr.is/types'

export interface IPdfService {
  generatePdfByCaseId(
    caseId: string,
    publishedAt?: string,
    serial?: number,
  ): Promise<ResultWrapper<Buffer>>

  getPdfByApplicationId(
    applicationId: string,
    showDate?: boolean,
  ): Promise<ResultWrapper<Buffer>>
}

export const IPdfService = Symbol('IPdfService')
