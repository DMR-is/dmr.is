import {
  Controller,
  Get,
  Inject,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ParsedReportDto } from './dto/parsed-report.dto'
import { IReportExcelService } from './report-excel.service.interface'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const ONE_MB = 1024 * 1024
const MAX_UPLOAD_BYTES = ONE_MB * 20

@Controller({
  path: 'reports/excel',
  version: '1',
})
@ApiTags('Report Excel')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ReportExcelController {
  constructor(
    @Inject(IReportExcelService)
    private readonly reportExcelService: IReportExcelService,
  ) {}

  @Get('template')
  @ApiProduces(XLSX_MIME)
  @DoeResponse({
    operationId: 'getBlankExcelTemplate',
    successDescription: 'Blank salary report template',
  })
  async getTemplate(): Promise<StreamableFile> {
    const buf = await this.reportExcelService.generateBlankTemplate()
    return new StreamableFile(buf, {
      type: XLSX_MIME,
      disposition: 'attachment; filename="salary-report-template.xlsx"',
    })
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @DoeResponse({
    operationId: 'importSalaryReportWorkbook',
    type: ParsedReportDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async importWorkbook(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: MAX_UPLOAD_BYTES })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ParsedReportDto> {
    return this.reportExcelService.importWorkbook(file.buffer)
  }
}
