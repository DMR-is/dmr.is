import { CompanySizeEnum } from '../../company/models/company.enums'
import { CompanyImportErrorDto } from './company-import-result.dto'

/**
 * One valid data row extracted from the import workbook. Pure parse output —
 * the ISAT code is not yet checked against `isat_category` and the postcode is
 * not yet resolved to a `postcodeId`; the service does both (DB-dependent).
 */
export interface ParsedCompanyRow {
  /** 1-based spreadsheet row number (for error reporting). */
  row: number
  nationalId: string
  name: string
  address: string | null
  /** POSTNUMER as a string code, e.g. "200". Resolved to a postcode by the service. */
  postcodeCode: string | null
  /** Normalized 5-digit ÍSAT code, e.g. "01110". Validated by the service. */
  isatCategoryCode: string | null
  size: CompanySizeEnum
}

export interface ParsedCompanyImport {
  rows: ParsedCompanyRow[]
  errors: CompanyImportErrorDto[]
  /** TEKJUAR — present only if all rows agree on a single year. */
  year: number | null
}
