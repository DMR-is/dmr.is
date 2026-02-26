import {
  CreateInstitution,
  GetInstitution,
  GetInstitutions,
  InstitutionQuery,
  UpdateInstitution,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

export interface IInstitutionService {
  getInstitutions(
    query: InstitutionQuery,
  ): Promise<ResultWrapper<GetInstitutions>>
  getInstitution(id: string): Promise<ResultWrapper<GetInstitution>>
  createInstitution(
    institution: CreateInstitution,
  ): Promise<ResultWrapper<GetInstitution>>
  updateInstitution(
    id: string,
    institution: UpdateInstitution,
  ): Promise<ResultWrapper<GetInstitution>>
  deleteInstitution(id: string): Promise<ResultWrapper>
}

export const IInstitutionService = Symbol('IInstitutionService')
