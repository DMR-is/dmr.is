import { ResultWrapper } from '@dmr.is/types'

export interface IPdfService {
  generatePdfByCaseId(
    caseId: string,
    publishedAt?: string | Date,
    serial?: number | string,
    correctionDate?: string | Date,
  ): Promise<ResultWrapper<Buffer>>

  getPdfByApplicationId(
    applicationId: string,
    showDate?: boolean,
  ): Promise<ResultWrapper<Buffer>>

  generateIssuePdf(html: string): Promise<Buffer>
}

export const IPdfService = Symbol('IPdfService')
