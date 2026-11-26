import { ResultWrapper } from '@dmr.is/types'

import { ApplicationCaller } from '../auth/application-party'

export interface IssuePdfAdvertInput {
  html: string
  issueTopMeta?: string
  publicationDate: string | Date
  serial: number | string
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
    caller: Pick<ApplicationCaller, 'nationalId'>,
    showDate?: boolean,
  ): Promise<ResultWrapper<Buffer>>

  generateIssuePdf(
    frontpage: string,
    tableOfContents: string,
    adverts: IssuePdfAdvertInput[],
  ): Promise<Buffer>
}

export const IPdfService = Symbol('IPdfService')
