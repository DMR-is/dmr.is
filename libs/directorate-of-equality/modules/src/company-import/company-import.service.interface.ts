import { CompanyImportResultDto } from './dto/company-import-result.dto'

export interface ICompanyImportService {
  /** Parse + reconcile against the DB and return the diff. Writes nothing. */
  /**
   * Fetch the staged workbook at `key` and plan the import without writing.
   *
   * Takes a key rather than a buffer so the download happens under the parse
   * gate; the buffer is the memory the gate bounds.
   */
  preview(key: string): Promise<CompanyImportResultDto>
  /** Parse + reconcile, then apply in one transaction. Returns the committed result. */
  apply(key: string, actorUserId: string): Promise<CompanyImportResultDto>
}

export const ICompanyImportService = Symbol('ICompanyImportService')
