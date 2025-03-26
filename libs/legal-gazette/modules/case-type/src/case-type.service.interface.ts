import {
  CreateCaseTypeDto,
  GetCaseTypeDto,
  GetCaseTypesDetailedDto,
  GetCaseTypesDto,
  UpdateCaseTypeDto,
} from './dto/case-type.dto'

export interface ICaseTypeService {
  getCaseTypes(): Promise<GetCaseTypesDto>

  getCaseTypesDetailed(): Promise<GetCaseTypesDetailedDto>

  createCaseType(body: CreateCaseTypeDto): Promise<GetCaseTypeDto>

  updateCaseType(id: string, body: UpdateCaseTypeDto): Promise<GetCaseTypeDto>

  deleteCaseType(id: string): Promise<GetCaseTypeDto>
}

export const ICaseTypeService = Symbol('ICaseTypeService')
