import { GetCaseTypesDto } from './dto/case-type.dto'

export interface ICaseTypeService {
  getCaseTypes(): Promise<GetCaseTypesDto>
}
