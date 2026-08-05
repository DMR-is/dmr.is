import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { PagingQuery } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { GetReportOutliersResponseDto } from '../report-employee/dto/get-report-outliers-response.dto'
import { GetReportOutlierGroupsResponseDto } from './dto/get-report-outlier-groups-response.dto'
import { GetReportOutliersQueryDto } from './dto/get-report-outliers.query.dto'
import { GetReportsQueryDto } from './dto/get-reports.query.dto'
import { GetReportsForCompanyResponseDto } from './dto/get-reports-for-company-response.dto'
import { GetReportsResponseDto } from './dto/get-reports-response.dto'
import { ReportDetailDto } from './dto/report-detail.dto'
import { ReportOverviewDto } from './dto/report-overview.dto'
import { ReportOverviewStatisticsDto } from './dto/report-overview-statistics.dto'
import { IReportService } from './report.service.interface'

@Controller({ path: 'reports', version: '1' })
@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ReportController {
  constructor(
    @Inject(IReportService) private readonly reportService: IReportService,
  ) {}

  @Get('overview')
  @DoeResponse({ operationId: 'getReportOverview', type: ReportOverviewDto })
  async getOverview(
    @CurrentUser() user: DMRUser,
  ): Promise<ReportOverviewDto> {
    return this.reportService.getOverview(user.nationalId)
  }

  @Get('overview/statistics')
  @DoeResponse({
    operationId: 'getReportOverviewStatistics',
    type: ReportOverviewStatisticsDto,
  })
  async getOverviewStatistics(): Promise<ReportOverviewStatisticsDto> {
    return this.reportService.getOverviewStatistics()
  }

  @Get()
  @DoeResponse({ operationId: 'listReports', type: GetReportsResponseDto })
  async list(
    @Query() query: GetReportsQueryDto,
  ): Promise<GetReportsResponseDto> {
    return this.reportService.list(query)
  }

  @Get('company/:companyId')
  @DoeResponse({
    operationId: 'listReportsForCompany',
    type: GetReportsForCompanyResponseDto,
    description:
      "Reports that include the given company — whether it filed on its own behalf or was included as a subsidiary on a parent company's group submission. Powers the company-detail reports tab. Newest first.",
  })
  async listForCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() query: PagingQuery,
  ): Promise<GetReportsForCompanyResponseDto> {
    return this.reportService.listForCompany(companyId, query)
  }

  @Get(':id')
  @DoeResponse({
    operationId: 'getReportById',
    type: ReportDetailDto,
    include404: true,
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportDetailDto> {
    return this.reportService.getById(id)
  }

  @Get(':id/outliers')
  @DoeResponse({
    operationId: 'getReportOutliers',
    type: GetReportOutliersResponseDto,
    include404: true,
    description:
      'Paginated list of a report\'s employee outliers — the rows behind the Úrbótaáætlun table. Split out from the report-detail payload because a single salary report can carry hundreds of rows. Defaults to `employeeOrdinal` ascending; override with `sortBy` + `direction`.',
  })
  async getOutliers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetReportOutliersQueryDto,
  ): Promise<GetReportOutliersResponseDto> {
    return this.reportService.getOutliers(id, query)
  }

  @Get(':id/outlier-groups')
  @DoeResponse({
    operationId: 'getReportOutlierGroups',
    type: GetReportOutlierGroupsResponseDto,
    include404: true,
    description:
      "A report's outlier groups (id, name, and the shared reason/action/signature explanation). A report with detected outliers always has at least one group; multiple groups drive the per-group Úrbótaáætlun tables.",
  })
  async getOutlierGroups(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetReportOutlierGroupsResponseDto> {
    return this.reportService.getOutlierGroups(id)
  }
}
