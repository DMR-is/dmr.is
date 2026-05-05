import { randomBytes } from 'crypto'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function randomAlpha(length = 6): string {
  return Array.from(randomBytes(length), (b) => ALPHA[b % ALPHA.length]).join(
    '',
  )
}

import { ICompanyService } from '../company/company.service.interface'
import { CompanyModel } from '../company/models/company.model'
import { IReportService } from '../report/report.service.interface'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { IReportCreateService } from '../report-create/report-create.service.interface'
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
  ) {}

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
      identifier: randomAlpha(),
      equalityReportId: equalityReport.id,
      companies: [CompanyModel.toSnapshot(company)],
    })
  }
}
