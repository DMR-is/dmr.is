import { BadRequestException, Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ImportUploadBoundary } from '../import-upload/import-upload.service.interface'
import { ImportErrorDto } from './dto/import-error.dto'
import { ParsedReportDto } from './dto/parsed-report.dto'
import { parseWorkbook } from './parser/workbook.parser'
import { IReportExcelService } from './report-excel.service.interface'
import { TEMPLATE_BASE64 } from './template-data'

const LOGGING_CONTEXT = 'ReportExcelService'

/**
 * Stable, searchable marker for Excel import validation failures. Facet on
 * `@errorCode:EXCEL_IMPORT_VALIDATION_FAILED` in Datadog to find every
 * rejected upload — the generic HttpExceptionFilter log can't be told apart
 * from any other 400.
 */
const EXCEL_IMPORT_VALIDATION_FAILED = 'EXCEL_IMPORT_VALIDATION_FAILED'

@Injectable()
export class ReportExcelService implements IReportExcelService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async generateBlankTemplate(): Promise<Buffer> {
    this.logger.debug('Serving blank template', { context: LOGGING_CONTEXT })
    return Buffer.from(TEMPLATE_BASE64, 'base64')
  }

  async importWorkbook(
    fileBuffer: Buffer,
    boundary: ImportUploadBoundary,
  ): Promise<ParsedReportDto> {
    this.logger.debug('Importing workbook', {
      context: LOGGING_CONTEXT,
      size: fileBuffer.length,
      boundary,
    })
    try {
      return await parseWorkbook(fileBuffer)
    } catch (e) {
      if (e instanceof BadRequestException) {
        const response = e.getResponse()
        const errors: ImportErrorDto[] =
          typeof response === 'object' &&
          response !== null &&
          'errors' in response &&
          Array.isArray((response as { errors: unknown }).errors)
            ? (response as { errors: ImportErrorDto[] }).errors
            : []

        // Dedicated, greppable log so Excel import failures stand out from the
        // generic HttpExceptionFilter 400 noise. Facet on `errorCode` and
        // `boundary` (admin vs application) and read `errorCount` / `errors`
        // for the breakdown without opening the file.
        this.logger.warn('Excel import validation failed', {
          context: LOGGING_CONTEXT,
          errorCode: EXCEL_IMPORT_VALIDATION_FAILED,
          boundary,
          errorCount: errors.length,
          errors,
        })
      }
      throw e
    }
  }
}
