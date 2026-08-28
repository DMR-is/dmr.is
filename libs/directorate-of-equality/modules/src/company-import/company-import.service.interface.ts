import { CompanyImportResultDto } from './dto/company-import-result.dto'

export interface ICompanyImportService {
  /** Parse + reconcile against the DB and return the diff. Writes nothing. */
  preview(fileBuffer: Buffer): Promise<CompanyImportResultDto>
  /** Parse + reconcile, then apply in one transaction. Returns the committed result. */
  apply(fileBuffer: Buffer, actorUserId: string): Promise<CompanyImportResultDto>
}

export const ICompanyImportService = Symbol('ICompanyImportService')
