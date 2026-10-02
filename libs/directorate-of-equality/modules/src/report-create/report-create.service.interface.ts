import {
  ReportProviderEnum,
  ReportTypeEnum,
} from '../report/models/report.enums'
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
  /**
   * The replay `createSalary` / `createEquality` would answer for this tuple,
   * or null when it is unused. Throws the same 409s they do. For a channel that
   * does work before it can build their input and must not do it for a replay.
   */
  findReplay(
    providerType: ReportProviderEnum,
    providerId: string,
    submittingCompanyId: string,
    type: ReportTypeEnum,
  ): Promise<CreateReportResponseDto | null>
}

export const IReportCreateService = Symbol('IReportCreateService')
