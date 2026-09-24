import { CreateEqualityReportDto } from './dto/create-equality-report.dto'
import { CreateReportDto } from './dto/create-report.dto'
import { CreateReportResponseDto } from './dto/create-report-response.dto'
import {
  CreateEqualityOptions,
  CreateSalaryOptions,
} from './dto/create-salary-options'

export interface IReportCreateService {
  createSalary(
    input: CreateReportDto,
    options?: CreateSalaryOptions,
  ): Promise<CreateReportResponseDto>
  createEquality(
    input: CreateEqualityReportDto,
    options?: CreateEqualityOptions,
  ): Promise<CreateReportResponseDto>
}

export const IReportCreateService = Symbol('IReportCreateService')
