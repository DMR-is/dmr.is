import { Result } from '@dmr.is/types'

export interface IPdfService {
  getPdfByCaseId(caseId: string): Promise<Result<Buffer>>

  getPdfByApplicationId(applicationId: string): Promise<Result<Buffer>>
}

export const IPdfService = Symbol('IPdfService')
