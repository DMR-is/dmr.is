import { ResultWrapper } from '@dmr.is/types'
import {
  CreateInstitution,
  UpdateInstitution,
} from '@dmr.is/official-journal/dto/institution/institution.dto'
import { GetInstitution } from './dto/get-institution-response.dto'
import { GetInstitutions } from './dto/get-institutions-response.dto'
import { InstitutionQuery } from './dto/get-institutions-query.dto'

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
