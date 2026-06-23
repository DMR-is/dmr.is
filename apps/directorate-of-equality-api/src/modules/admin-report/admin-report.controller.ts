import {
  Body,
  Controller,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ImportKeyDto } from '../import-upload/dto/import-key.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { ParsedReportDto } from '../report-excel/dto/parsed-report.dto'
import { IReportExcelService } from '../report-excel/report-excel.service.interface'
import { AdminEqualityReportDto } from './dto/admin-equality-report.dto'
import { AdminSalaryReportDto } from './dto/admin-salary-report.dto'
import { IAdminReportService } from './admin-report.service.interface'

@Controller({
  path: 'admin-report',
  version: '1',
})
@ApiTags('Admin Report')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class AdminReportController {
  constructor(
    @Inject(IAdminReportService)
    private readonly adminReportService: IAdminReportService,
    @Inject(IReportExcelService)
    private readonly reportExcelService: IReportExcelService,
    @Inject(IImportUploadService)
    private readonly importUploadService: IImportUploadService,
  ) {}

  @Post('companies/:companyId/reports/excel/import')
  @ApiParam({ name: 'companyId', type: String })
  @DoeResponse({
    operationId: 'importAdminSalaryReportWorkbook',
    type: ParsedReportDto,
  })
  async importWorkbook(
    @Param('companyId', ParseUUIDPipe) _companyId: string,
    @Body() body: ImportKeyDto,
  ): Promise<ParsedReportDto> {
    const buffer = await this.importUploadService.fetchWorkbook(
      body.key,
      ImportUploadBoundary.ADMIN,
    )
    try {
      return await this.reportExcelService.importWorkbook(buffer)
    } finally {
      await this.importUploadService.cleanup(body.key)
    }
  }

  @Post('companies/:companyId/reports/salary')
  @ApiParam({ name: 'companyId', type: String })
  @DoeResponse({
    operationId: 'submitAdminSalaryReport',
    status: 201,
    type: CreateReportResponseDto,
  })
  async submitSalary(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() input: AdminSalaryReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.adminReportService.submitSalary(companyId, input)
  }

  @Post('companies/:companyId/reports/equality')
  @ApiParam({ name: 'companyId', type: String })
  @DoeResponse({
    operationId: 'submitAdminEqualityReport',
    status: 201,
    type: CreateReportResponseDto,
  })
  async submitEquality(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() input: AdminEqualityReportDto,
  ): Promise<CreateReportResponseDto> {
    return this.adminReportService.submitEquality(companyId, input)
  }
}
