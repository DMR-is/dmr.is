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

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { GetReportsQueryDto } from './dto/get-reports.query.dto'
import { GetReportsResponseDto } from './dto/get-reports-response.dto'
import { ReportDetailDto } from './dto/report-detail.dto'
import { IReportService } from './report.service.interface'

@Controller({ path: 'reports', version: '1' })
@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ReportController {
  constructor(
    @Inject(IReportService) private readonly reportService: IReportService,
  ) {}

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
