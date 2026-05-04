import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ICompanyService } from '../company/company.service.interface'
import { CompanyModel } from '../company/models/company.model'
import { CreateReportResponseDto } from '../report-create/dto/create-report-response.dto'
import { IReportCreateService } from '../report-create/report-create.service.interface'
import { ParsedReportDto } from '../report-excel/dto/parsed-report.dto'
import { IReportExcelService } from '../report-excel/report-excel.service.interface'
import { AdminEqualityReportDto } from './dto/admin-equality-report.dto'
import { AdminSalaryReportDto } from './dto/admin-salary-report.dto'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const ONE_MB = 1024 * 1024
const MAX_UPLOAD_BYTES = ONE_MB * 20

@Controller({
  path: 'admin-report',
  version: '1',
})
@ApiTags('Admin Report')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class AdminReportController {
  constructor(
    @Inject(ICompanyService)
    private readonly companyService: ICompanyService,
    @Inject(IReportExcelService)
    private readonly reportExcelService: IReportExcelService,
    @Inject(IReportCreateService)
    private readonly reportCreateService: IReportCreateService,
  ) {}

  @Post('companies/:companyId/reports/excel/import')
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'companyId', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @DoeResponse({
    operationId: 'importAdminSalaryReportWorkbook',
    type: ParsedReportDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async importWorkbook(
    @Param('companyId', ParseUUIDPipe) _companyId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ParsedReportDto> {
    return this.reportExcelService.importWorkbook(file.buffer)
  }

  @Post('companies/:companyId/reports/salary')
  @HttpCode(HttpStatus.CREATED)
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
    const company = await this.companyService.getById(companyId)
    return this.reportCreateService.createSalary({
      ...input,
      companies: [CompanyModel.toSnapshot(company)],
    })
  }

  @Post('companies/:companyId/reports/equality')
  @HttpCode(HttpStatus.CREATED)
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
    const company = await this.companyService.getById(companyId)
    return this.reportCreateService.createEquality({
      ...input,
      companies: [CompanyModel.toSnapshot(company)],
    })
  }
}
