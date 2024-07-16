import { GetCasePdfResponse } from '@dmr.is/shared/dto'
import { Result } from '@dmr.is/types'

export interface IPdfService {
  getCasePdf(caseId: string): Promise<Result<GetCasePdfResponse>>
}

export const IPdfService = Symbol('IPdfService')
