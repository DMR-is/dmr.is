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
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { GetReportsQueryDto } from './dto/get-reports.query.dto'
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
}
