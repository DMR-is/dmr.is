import { GetCasesQuery, GetCasesReponse } from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface ICaseListService {
  getCases(params: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>>
}

export const ICaseListService = Symbol('ICaseListService')
