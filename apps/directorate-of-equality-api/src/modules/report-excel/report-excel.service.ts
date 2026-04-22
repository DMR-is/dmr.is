import { Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ParsedReportDto } from './dto/parsed-report.dto'
import { parseWorkbook } from './parser/workbook.parser'
import { IReportExcelService } from './report-excel.service.interface'
import { TEMPLATE_BASE64 } from './template-data'

const LOGGING_CONTEXT = 'ReportExcelService'

@Injectable()
export class ReportExcelService implements IReportExcelService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async generateBlankTemplate(): Promise<Buffer> {
    this.logger.debug('Serving blank template', { context: LOGGING_CONTEXT })
    return Buffer.from(TEMPLATE_BASE64, 'base64')
  }

  async importWorkbook(fileBuffer: Buffer): Promise<ParsedReportDto> {
    this.logger.debug('Importing workbook', {
      context: LOGGING_CONTEXT,
      size: fileBuffer.length,
    })
    return parseWorkbook(fileBuffer)
  }
}
