import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ImportUploadBoundary } from '../import-upload/import-upload.service.interface'
import { ImportErrorDto } from './dto/import-error.dto'
import { ParsedReportDto } from './dto/parsed-report.dto'
import { Semaphore, SemaphoreQueueFullError } from './lib/semaphore'
import { parseWorkbook } from './parser/workbook.parser'
import { IReportExcelService } from './report-excel.service.interface'
import { TEMPLATE_BASE64 } from './template-data'

const LOGGING_CONTEXT = 'ReportExcelService'

/**
 * Parsing one workbook holds ~350MB of heap (exceljs model), so unbounded
 * concurrent imports OOM the container. These bound per-instance parse
 * concurrency: worst-case parse memory ≈ `maxConcurrent × ~350MB`. Both are
 * env-overridable so devops can retune against the task's heap without a
 * redeploy. Defaults are deliberately conservative (2 running, 20 waiting).
 */
const MAX_CONCURRENT_PARSES = Number(
  process.env.DOE_EXCEL_MAX_CONCURRENT_PARSES ?? 2,
)
const MAX_QUEUED_PARSES = Number(process.env.DOE_EXCEL_MAX_QUEUED_PARSES ?? 20)

/** Searchable marker for uploads shed because the parse gate was saturated. */
const EXCEL_IMPORT_BUSY = 'EXCEL_IMPORT_BUSY'

/**
 * Stable, searchable marker for Excel import validation failures. Facet on
 * `@errorCode:EXCEL_IMPORT_VALIDATION_FAILED` in Datadog to find every
 * rejected upload — the generic HttpExceptionFilter log can't be told apart
 * from any other 400.
 */
const EXCEL_IMPORT_VALIDATION_FAILED = 'EXCEL_IMPORT_VALIDATION_FAILED'

@Injectable()
export class ReportExcelService implements IReportExcelService {
  // Shared across every import path (application / admin / bulk draft-seed) —
  // they all funnel through importWorkbook, so one gate bounds total parse
  // concurrency for the instance.
  private readonly parseGate = new Semaphore(
    MAX_CONCURRENT_PARSES,
    MAX_QUEUED_PARSES,
  )

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

    const release = await this.acquireParseSlot(boundary)
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
    } finally {
      release()
    }
  }

  /**
   * Acquire a parse slot, translating a saturated gate into a 503 the client
   * can retry. Logs a distinct, greppable marker so shed load is visible in
   * Datadog separately from validation 400s.
   */
  private async acquireParseSlot(
    boundary: ImportUploadBoundary,
  ): Promise<() => void> {
    try {
      return await this.parseGate.acquire()
    } catch (e) {
      if (e instanceof SemaphoreQueueFullError) {
        this.logger.warn('Excel import shed — parse gate saturated', {
          context: LOGGING_CONTEXT,
          errorCode: EXCEL_IMPORT_BUSY,
          boundary,
          activeParses: this.parseGate.activeCount,
          queuedParses: this.parseGate.queuedCount,
        })
        throw new ServiceUnavailableException(
          'Innflutningur er upptekinn í augnablikinu. Reyndu aftur eftir smástund.',
        )
      }
      throw e
    }
  }
}
