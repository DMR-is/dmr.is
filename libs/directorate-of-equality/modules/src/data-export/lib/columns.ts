/**
 * Column definitions for the company export.
 *
 * A column is a header plus a pure accessor, and the ORDER of the array is the
 * order of the sheet. Keeping the two halves in one object is what makes a
 * header and the value under it impossible to get out of step — the failure
 * mode of a parallel `headers[]` / `row()` pair is a file where every column is
 * labelled as its neighbour, which reads as plausible data.
 *
 * Accessors return `string | number | Date | null`. `null` becomes an empty
 * cell, never the string "null" and never 0 — a company with no due date has
 * no due date, which is not the same as one due on the epoch.
 */

import {
  boolLabel,
  COMPANY_REPORT_STATUS_LABEL,
  COMPANY_SECTOR_LABEL,
  COMPANY_SIZE_LABEL,
  COMPANY_STATUS_LABEL,
  OBLIGATION_STATUS_LABEL,
} from './labels'
import type { CompanyExportRow } from './rows'

export type ExportCellValue = string | number | Date | null

export type ExportColumn<TRow> = {
  header: string
  value: (row: TRow) => ExportCellValue
  /** Column width in characters. */
  width?: number
}

// ---------------------------------------------------------------------------
// Companies — the register
// ---------------------------------------------------------------------------

export const COMPANY_EXPORT_COLUMNS: ExportColumn<CompanyExportRow>[] = [
  { header: 'Nafn', value: (r) => r.company.name, width: 38 },
  { header: 'Kennitala', value: (r) => r.company.nationalId, width: 12 },
  {
    header: 'Starfsmannafjöldi',
    value: (r) => COMPANY_SIZE_LABEL[r.company.employeeCountCategory],
    width: 16,
  },
  {
    header: 'Rekstrarform',
    value: (r) => COMPANY_SECTOR_LABEL[r.company.sector],
    width: 16,
  },
  {
    header: 'Rekstrarform handvalið',
    value: (r) => boolLabel(r.company.sectorOverride),
    width: 12,
  },
  {
    header: 'Rekstrarform (RSK)',
    value: (r) => r.company.legalFormName,
    width: 24,
  },
  {
    header: 'ÍSAT-bálkur',
    value: (r) => r.company.isatCategory?.section ?? null,
    width: 10,
  },
  {
    header: 'ÍSAT-bálkur heiti',
    value: (r) => r.isatSectionDescription,
    width: 34,
  },
  {
    header: 'ÍSAT-númer',
    value: (r) =>
      r.company.isatCategory?.codeDotted ?? r.company.isatCategoryCode,
    width: 12,
  },
  {
    header: 'Atvinnugrein',
    value: (r) => r.company.isatCategory?.description ?? null,
    width: 40,
  },
  { header: 'Heimilisfang', value: (r) => r.company.address, width: 30 },
  { header: 'Póstnúmer', value: (r) => r.postcode, width: 10 },
  { header: 'Staður', value: (r) => r.place, width: 18 },
  { header: 'Landshluti', value: (r) => r.region, width: 20 },
  {
    header: 'Staða í skrá',
    value: (r) => COMPANY_STATUS_LABEL[r.company.status],
    width: 12,
  },
  {
    header: 'Heildarstaða',
    value: (r) => COMPANY_REPORT_STATUS_LABEL[r.company.reportStatus],
    width: 22,
  },
  {
    header: 'Jafnréttisáætlun',
    value: (r) => OBLIGATION_STATUS_LABEL[r.company.equalityObligationStatus],
    width: 18,
  },
  {
    header: 'Jafnréttisáætlun á eftir áætlun',
    value: (r) => boolLabel(r.company.equalityReportOverdue),
    width: 14,
  },
  {
    header: 'Jafnréttisáætlun næsti skiladagur',
    value: (r) => r.company.nextEqualityReportDueAt,
    width: 16,
  },
  {
    header: 'Skýrslugjöf',
    value: (r) => OBLIGATION_STATUS_LABEL[r.company.salaryObligationStatus],
    width: 18,
  },
  {
    header: 'Skýrslugjöf á eftir áætlun',
    value: (r) => boolLabel(r.company.salaryReportOverdue),
    width: 14,
  },
  {
    header: 'Skýrslugjöf næsti skiladagur',
    value: (r) => r.company.nextSalaryReportDueAt,
    width: 16,
  },
  {
    header: 'Skýrslugjöf skylda',
    value: (r) => boolLabel(r.company.salaryReportRequired),
    width: 12,
  },
  {
    header: 'Skýrslugjöf skylda handvalin',
    value: (r) => boolLabel(r.company.salaryReportRequiredOverride),
    width: 12,
  },
  // Submitted headcount, from the company's most recent approved report.
  // The company row itself only holds a bucket; these are the real numbers
  // and they are the only source for "how many people are covered".
  {
    header: 'Starfsmenn karlar',
    value: (r) => r.employeeCounts?.male ?? null,
    width: 12,
  },
  {
    header: 'Starfsmenn konur',
    value: (r) => r.employeeCounts?.female ?? null,
    width: 12,
  },
  {
    header: 'Starfsmenn kynsegin/annað',
    value: (r) => r.employeeCounts?.neutral ?? null,
    width: 12,
  },
  {
    header: 'Starfsmenn alls',
    value: (r) => r.employeeCounts?.total ?? null,
    width: 12,
  },
  {
    header: 'Starfsmannatölur úr skýrslu dags.',
    value: (r) => r.employeeCounts?.reportedAt ?? null,
    width: 16,
  },
  { header: 'Netfang', value: (r) => r.company.email, width: 28 },
  {
    header: 'Dagsektir',
    value: (r) => boolLabel(r.company.finesStarted),
    width: 10,
  },
  {
    header: 'Í vari',
    value: (r) => boolLabel(r.company.quarantined),
    width: 10,
  },
  {
    header: 'Gögn úr eldra kerfi',
    value: (r) => boolLabel(r.company.hasLegacyReports),
    width: 12,
  },
]
