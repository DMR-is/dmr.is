import { ResultWrapper } from '@dmr.is/types'
import {
  InstitutionQuery,
  GetInstitutions,
  GetInstitution,
  CreateInstitution,
  UpdateInstitution,
} from './dto/institution.dto'

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
