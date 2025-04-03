import { DefaultSearchParams } from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { GetCasesInProgressReponse } from './dto/get-cases-in-progress-response.dto'

export interface IJournalService {
  getCasesInProgress(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetCasesInProgressReponse>>
}

export const IJournalService = Symbol('IJournalService')
