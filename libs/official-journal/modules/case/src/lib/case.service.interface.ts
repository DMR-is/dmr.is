import { ResultWrapper } from '@dmr.is/types'
import { GetCasesQuery } from './dto/case.dto'

export interface ICaseService {
  getCase(id: string): Promise<ResultWrapper<GetCaseResponse>>
  getCases(params?: GetCasesQuery): Promise<ResultWrapper<GetCasesReponse>>

  getCasesWithPublicationNumber(
    department: string,
    params: GetCasesWithPublicationNumberQuery,
  ): Promise<ResultWrapper<GetCasesWithPublicationNumber>>

  getCasesWithDepartmentCount(
    department: string,
    query?: GetCasesWithDepartmentCountQuery,
  ): Promise<ResultWrapper<GetCasesWithDepartmentCount>>
}

export const ICaseService = Symbol('ICaseService')
