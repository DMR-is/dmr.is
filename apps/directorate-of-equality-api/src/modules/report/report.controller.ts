import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { GetReportsQueryDto } from './dto/get-reports.query.dto'
import { GetReportsResponseDto } from './dto/get-reports-response.dto'
import { ReportDetailDto } from './dto/report-detail.dto'
import { IReportService } from './report.service.interface'

@Controller({ path: 'reports', version: '1' })
@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class ReportController {
  constructor(
    @Inject(IReportService) private readonly reportService: IReportService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'listReports' })
  @ApiResponse({ status: 200, type: GetReportsResponseDto })
  async list(
    @Query() query: GetReportsQueryDto,
  ): Promise<GetReportsResponseDto> {
    return this.reportService.list(query)
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getReportById' })
  @ApiResponse({ status: 200, type: ReportDetailDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportDetailDto> {
    return this.reportService.getById(id)
  }
}
