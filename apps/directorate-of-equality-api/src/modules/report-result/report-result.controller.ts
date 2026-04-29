import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { ReportResultDto } from './dto/report-result.dto'
import { IReportResultService } from './report-result.service.interface'

@Controller({
  path: 'reports/:reportId/result',
  version: '1',
})
@ApiTags('Report Results')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class ReportResultController {
  constructor(
    @Inject(IReportResultService)
    private readonly reportResultService: IReportResultService,
  ) {}

  @Get()
  @ApiOperation({
    operationId: 'getReportResultByReportId',
    description:
      'Returns the persisted report result snapshot for a salary report, including report-level and role-level base/full compensation aggregates.',
  })
  @ApiResponse({ status: 200, type: ReportResultDto })
  async getByReportId(
    @Param('reportId') reportId: string,
  ): Promise<ReportResultDto> {
    return this.reportResultService.getByReportId(reportId)
  }
}
