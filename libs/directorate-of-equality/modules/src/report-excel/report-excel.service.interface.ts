import { ImportUploadBoundary } from '../import-upload/import-upload.service.interface'
import { ParsedReportDto } from './dto/parsed-report.dto'

export interface IReportExcelService {
  generateBlankTemplate(): Promise<Buffer>
  /**
   * Fetch the staged workbook at `key` and parse it, holding one parse slot
   * across both.
   *
   * Takes a key rather than a buffer on purpose: the buffer is the memory the
   * gate exists to bound, so it must not be allocated before a slot is held.
   * See `import-upload/archive-budget.ts`.
   */
  importWorkbook(
    key: string,
    boundary: ImportUploadBoundary,
  ): Promise<ParsedReportDto>
}

export const IReportExcelService = Symbol('IReportExcelService')
