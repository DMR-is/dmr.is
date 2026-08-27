import { CreateEqualityReportDto } from './dto/create-equality-report.dto'
import { CreateReportDto } from './dto/create-report.dto'
import { CreateReportResponseDto } from './dto/create-report-response.dto'

export interface IReportCreateService {
  createSalary(input: CreateReportDto): Promise<CreateReportResponseDto>
  createEquality(
    input: CreateEqualityReportDto,
  ): Promise<CreateReportResponseDto>
}

export const IReportCreateService = Symbol('IReportCreateService')
