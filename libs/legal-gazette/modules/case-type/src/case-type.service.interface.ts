import { GetCaseTypesDetailedDto, GetCaseTypesDto } from './dto/case-type.dto'

export interface ICaseTypeService {
  getCaseTypes(): Promise<GetCaseTypesDto>

  getCaseTypesDetail(): Promise<GetCaseTypesDetailedDto>
}

export const ICaseTypeService = Symbol('ICaseTypeService')
