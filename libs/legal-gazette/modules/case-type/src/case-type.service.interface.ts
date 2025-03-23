import { Transaction } from 'sequelize'
import {
  CreateCaseTypeDto,
  GetCaseTypeDto,
  GetCaseTypesDetailedDto,
  GetCaseTypesDto,
  UpdateCaseTypeDto,
} from './dto/case-type.dto'

export interface ICaseTypeService {
  getCaseTypes(transaction?: Transaction): Promise<GetCaseTypesDto>

  getCaseTypesDetailed(
    transaction?: Transaction,
  ): Promise<GetCaseTypesDetailedDto>

  createCaseType(
    body: CreateCaseTypeDto,
    transaction?: Transaction,
  ): Promise<GetCaseTypeDto>

  updateCaseType(
    id: string,
    body: UpdateCaseTypeDto,
    transaction?: Transaction,
  ): Promise<GetCaseTypeDto>

  deleteCaseType(id: string, transaction?: Transaction): Promise<void>
}

export const ICaseTypeService = Symbol('ICaseTypeService')
