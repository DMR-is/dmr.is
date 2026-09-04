import { Response } from 'express'

import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import {
  GetReportOutlierGroupsResponseDto,
  GetReportOutliersQueryDto,
  GetReportsForCompanyResponseDto,
  GetReportsQueryDto,
  GetReportsResponseDto,
  IReportService,
  ReportDetailDto,
  ReportOverviewDto,
  ReportOverviewStatisticsDto,
} from '@dmr.is/doe-modules/report'
import { GetReportOutliersResponseDto } from '@dmr.is/doe-modules/report-employee'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { PagingQuery } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'

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

  /**
   * The jafnréttisáætlun PDF exactly as the company uploaded it.
   *
   * Not on `ReportPdfController` with the generated documents, because this is
   * not one: nothing renders here, the bytes are handed back as submitted. A
   * reviewer assessing a plan needs to see the file the company actually sent,
   * not a version of it the Directorate produced.
   *
   * 404 for an HTML-backed report — there is no file. Read `contentType` on the
   * report detail to know which case you are in before calling this.
   */
  @Get(':id/equality-content/pdf')
  @DoeResponse({
    operationId: 'getEqualityContentPdf',
    include404: true,
    produces: 'application/pdf',
    successDescription:
      'Returns the uploaded jafnréttisáætlun PDF verbatim. 404 when the ' +
      "report's equality content is HTML rather than an uploaded PDF.",
  })
  async getEqualityContentPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { pdf, fileName } = await this.reportService.getEqualityContentPdf(id)

    res.set({
      'Content-Type': 'application/pdf',
      // Inline: the admin web embeds this in an iframe rather than downloading
      // it, and `attachment` would make the browser save it instead of render.
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': pdf.length,
    })
    res.send(pdf)
  }

  @Get(':id/outliers')
  @DoeResponse({
    operationId: 'getReportOutliers',
    type: GetReportOutliersResponseDto,
    include404: true,
    description:
      'Paginated list of a report\'s employee outliers — the rows behind the Úrbótaáætlun table. Split out from the report-detail payload because a single salary report can carry hundreds of rows. Defaults to role title ascending, then `employeeOrdinal` ascending — the same grouped-by-role order the draft employee lists serve; override with `sortBy` + `direction`.',
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
