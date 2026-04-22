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
  ApiOperation,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

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
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class ReportExcelController {
  constructor(
    @Inject(IReportExcelService)
    private readonly reportExcelService: IReportExcelService,
  ) {}

  @Get('template')
  @ApiOperation({ operationId: 'getBlankExcelTemplate' })
  @ApiProduces(XLSX_MIME)
  @ApiResponse({ status: 200, description: 'Blank salary report template' })
  async getTemplate(): Promise<StreamableFile> {
    const buf = await this.reportExcelService.generateBlankTemplate()
    return new StreamableFile(buf, {
      type: XLSX_MIME,
      disposition: 'attachment; filename="salary-report-template.xlsx"',
    })
  }

  @Post('import')
  @ApiOperation({ operationId: 'importSalaryReportWorkbook' })
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
  @ApiResponse({ status: 200, type: ParsedReportDto })
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
