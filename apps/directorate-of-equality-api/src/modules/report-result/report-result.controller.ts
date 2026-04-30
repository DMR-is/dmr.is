import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ReportResultDto } from './dto/report-result.dto'
import { IReportResultService } from './report-result.service.interface'

@Controller({
  path: 'reports/:reportId/result',
  version: '1',
})
@ApiTags('Report Results')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ReportResultController {
  constructor(
    @Inject(IReportResultService)
    private readonly reportResultService: IReportResultService,
  ) {}

  @Get()
  @DoeResponse({
    operationId: 'getReportResultByReportId',
    errors: [400, 401, 403, 404, 500],
    description:
      'Returns the persisted report result snapshot for a salary report, including report-level and role-level base/full compensation aggregates.',
    type: ReportResultDto,
  })
  async getByReportId(
    @Param('reportId') reportId: string,
  ): Promise<ReportResultDto> {
    return this.reportResultService.getByReportId(reportId)
  }
}
