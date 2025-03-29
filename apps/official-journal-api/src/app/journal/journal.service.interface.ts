import {
  GetInstitutionResponse,
  GetInstitutionsResponse,
  Institution,
} from '@dmr.is/official-journal/modules/institution'
import { ResultWrapper } from '@dmr.is/types'

import { DefaultSearchParams } from './dto/default-search-params.dto'

export interface IJournalService {
  getInstitution(id: string): Promise<ResultWrapper<GetInstitutionResponse>>
  getInstitutions(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetInstitutionsResponse>>
  insertInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>>
  updateInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
