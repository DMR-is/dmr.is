import { randomBytes } from 'crypto'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function randomAlpha(length = 6): string {
  return Array.from(randomBytes(length), (b) => ALPHA[b % ALPHA.length]).join(
    '',
  )
}

import { ICompanyService } from '../company/company.service.interface'
import { CompanyModel } from '../company/models/company.model'
import { IConfigService } from '../config/config.service.interface'
import { IReportService } from '../report/report.service.interface'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { IReportCreateService } from '../report-create/report-create.service.interface'
import { SalaryAnalysisRequestDto } from '../report-statistics/dto/salary-analysis.request.dto'
import { SalaryAnalysisResponseDto } from '../report-statistics/dto/salary-analysis.response.dto'
import {
  analyzeSalaryPayload,
  SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
} from '../report-statistics/lib/salary-analysis'
import { AdminEqualityReportDto } from './dto/admin-equality-report.dto'
import { AdminSalaryReportDto } from './dto/admin-salary-report.dto'
import { IAdminReportService } from './admin-report.service.interface'

@Injectable()
export class AdminReportService implements IAdminReportService {
  constructor(
    @Inject(ICompanyService)
    private readonly companyService: ICompanyService,
    @Inject(IReportService)
    private readonly reportService: IReportService,
    @Inject(IReportCreateService)
    private readonly reportCreateService: IReportCreateService,
    @Inject(IConfigService)
    private readonly configService: IConfigService,
  ) {}

  /**
   * Detects outliers on a just-parsed workbook payload WITHOUT creating a
   * report, so the admin create-flow can surface them before submit. Funnels
   * through the same shared compute the submit endpoint uses server-side, so
   * the preview and the submit-time detection agree.
   */
  async analyzeSalary(
    _companyId: string,
    dto: SalaryAnalysisRequestDto,
  ): Promise<SalaryAnalysisResponseDto> {
    const thresholdPercent = await this.getSalaryDifferenceThresholdPercent()

    return analyzeSalaryPayload(dto.parsed, thresholdPercent)
  }

  private async getSalaryDifferenceThresholdPercent(): Promise<number> {
    const config = await this.configService.getByKey(
      SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
    )
    const parsed = parseFloat(config.value)

    if (!Number.isFinite(parsed)) {
      throw new InternalServerErrorException(
        `Config entry "${SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY}" must be numeric`,
      )
    }

    return parsed
  }

  async submitEquality(
    companyId: string,
    dto: AdminEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    const company = await this.companyService.getById(companyId)

    return this.reportCreateService.createEquality({
      ...dto,
      identifier: randomAlpha(),
      companies: [CompanyModel.toSnapshot(company)],
    })
  }

  async submitSalary(
    companyId: string,
    dto: AdminSalaryReportDto,
  ): Promise<CreateReportResponseDto> {
    const company = await this.companyService.getById(companyId)

    const equalityReport =
      await this.reportService.getActiveEqualityForCompany(companyId)

    if (!equalityReport) {
      throw new NotFoundException(
        `No approved equality report found for company ${companyId}`,
      )
    }

    return this.reportCreateService.createSalary({
      ...dto,
      outliersPostponed: dto.postponed,
      identifier: randomAlpha(),
      equalityReportId: equalityReport.id,
      companies: [CompanyModel.toSnapshot(company)],
    })
  }
}
