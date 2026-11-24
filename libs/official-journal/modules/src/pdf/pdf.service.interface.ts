import { ResultWrapper } from '@dmr.is/types'

export interface IssuePdfAdvertInput {
  html: string
  issueTopMeta?: string
  publicationDate: string | Date
  serial: number | string
}

export interface PdfCaller {
  /** The token subject: the applicant, or the party a delegate acts for. */
  nationalId?: string
}

export interface IPdfService {
  generatePdfByCaseId(
    caseId: string,
    publishedAt?: string | Date,
    serial?: number | string,
    correctionDate?: string | Date,
  ): Promise<ResultWrapper<Buffer>>

  getPdfByApplicationId(
    applicationId: string,
    caller: PdfCaller,
    showDate?: boolean,
  ): Promise<ResultWrapper<Buffer>>

  generateIssuePdf(
    frontpage: string,
    tableOfContents: string,
    adverts: IssuePdfAdvertInput[],
  ): Promise<Buffer>
}

export const IPdfService = Symbol('IPdfService')
