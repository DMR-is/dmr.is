import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../import-upload/import-upload.service.interface'
import { PARSE_GATE, ParseGate } from '../parse-gate/parse-gate.token'
import { SemaphoreQueueFullError } from '../parse-gate/semaphore'
import { ImportErrorDto } from './dto/import-error.dto'
import { ParsedReportDto } from './dto/parsed-report.dto'
import { parseWorkbook } from './parser/workbook.parser'
import { IReportExcelService } from './report-excel.service.interface'
import { TEMPLATE_BASE64 } from './template-data'

const LOGGING_CONTEXT = 'ReportExcelService'

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
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    // Injected, not constructed. Every report import path (application /
    // admin / bulk draft-seed) funnels through `importWorkbook`, but the
    // company-import path does not — and it parses workbooks of the same
    // cost. One gate for the process is what keeps the heap arithmetic in
    // `import-upload/archive-budget.ts` true; see `ParseGateCoreModule`.
    @Inject(PARSE_GATE) private readonly parseGate: ParseGate,
    // The download happens inside the gated region, so this service owns it
    // rather than the controllers. A caller that fetched first would be holding
    // the workbook while it waited for a slot, which is the memory the gate is
    // supposed to bound.
    @Inject(IImportUploadService)
    private readonly importUpload: IImportUploadService,
  ) {}

  async generateBlankTemplate(): Promise<Buffer> {
    this.logger.debug('Serving blank template', { context: LOGGING_CONTEXT })
    return Buffer.from(TEMPLATE_BASE64, 'base64')
  }

  async importWorkbook(
    key: string,
    boundary: ImportUploadBoundary,
  ): Promise<ParsedReportDto> {
    // Ahead of the gate: rejecting a malformed key costs nothing and allocates
    // nothing, so it must not consume a slot or a place in the queue.
    this.importUpload.assertKeyWithinBoundary(key, boundary)

    this.logger.debug('Importing workbook', {
      context: LOGGING_CONTEXT,
      boundary,
    })

    const release = await this.acquireParseSlot(boundary)
    try {
      // Inside the gate, deliberately. This is the allocation the slot is
      // permission for; see `import-upload/archive-budget.ts`.
      //
      // ⚠️ Known, and deliberately not fixed here: this read has no deadline.
      // `getObjectBuffer` takes only `maxBytes` and passes no `abortSignal` to
      // `client.send`, and the AWS client sets no `requestTimeout` — so a
      // stalled S3 read holds its slot indefinitely, and at the default of two
      // slots two stalls shed every workbook import in the process until it
      // restarts. A deadline scoped to here would be worse than the wedge: it
      // would release the slot while the download continued, putting the
      // allocation outside the bound the gate exists to hold. The fix belongs
      // in `aws.service.ts` (a `requestTimeout` or a threaded `AbortSignal`)
      // and touches every caller across OJOI, LG and regulations, so it ships
      // on its own rather than inside a `fix(doe)` diff.
      const fileBuffer = await this.importUpload.fetchWorkbook(key, boundary)
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
