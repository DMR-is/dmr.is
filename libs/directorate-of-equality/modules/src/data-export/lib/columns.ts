/**
 * Column definitions for the two exports.
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
  COMMUNICATION_STATUS_LABEL,
  COMPANY_REPORT_STATUS_LABEL,
  COMPANY_SECTOR_LABEL,
  COMPANY_SIZE_LABEL,
  COMPANY_STATUS_LABEL,
  EQUALITY_SOURCE_LABEL,
  GENDER_LABEL,
  OBLIGATION_STATUS_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_TYPE_LABEL,
  SALARY_DATA_BASIS_LABEL,
  WAGE_GAP_DIRECTION_LABEL,
} from './labels'
import type { CompanyExportRow, ReportExportRow } from './rows'

export type ExportCellValue = string | number | Date | null

export type ExportColumn<TRow> = {
  header: string
  value: (row: TRow) => ExportCellValue
  /** Column width in characters. Excel only; ignored by the CSV writer. */
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
    value: (r) => r.company.isatCategory?.isatSection?.description ?? null,
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

// ---------------------------------------------------------------------------
// Reports — the filings
// ---------------------------------------------------------------------------

export const REPORT_EXPORT_COLUMNS: ExportColumn<ReportExportRow>[] = [
  { header: 'Auðkenni', value: (r) => r.identifier, width: 12 },
  { header: 'Tegund', value: (r) => REPORT_TYPE_LABEL[r.type], width: 16 },
  { header: 'Staða', value: (r) => REPORT_STATUS_LABEL[r.status], width: 14 },
  {
    header: 'Samskiptastaða',
    value: (r) => COMMUNICATION_STATUS_LABEL[r.communicationStatus],
    width: 16,
  },
  { header: 'Fyrirtæki', value: (r) => r.companyName, width: 38 },
  { header: 'Kennitala', value: (r) => r.companyNationalId, width: 12 },
  {
    header: 'Starfsmannafjöldi',
    value: (r) =>
      r.companyEmployeeCountCategory
        ? COMPANY_SIZE_LABEL[r.companyEmployeeCountCategory]
        : null,
    width: 16,
  },
  {
    header: 'Rekstrarform',
    value: (r) =>
      r.companySector ? COMPANY_SECTOR_LABEL[r.companySector] : null,
    width: 16,
  },
  { header: 'ÍSAT-bálkur', value: (r) => r.companyIsatSection, width: 10 },
  { header: 'Atvinnugrein', value: (r) => r.companyIsatDescription, width: 40 },
  { header: 'Póstnúmer', value: (r) => r.postcode, width: 10 },
  { header: 'Landshluti', value: (r) => r.region, width: 20 },
  {
    header: 'Grundvöllur jafnréttisáætlunar',
    value: (r) => EQUALITY_SOURCE_LABEL[r.equalitySource],
    width: 22,
  },
  { header: 'Innsend', value: (r) => r.createdAt, width: 14 },
  { header: 'Samþykkt', value: (r) => r.approvedAt, width: 14 },
  { header: 'Gildir til', value: (r) => r.validUntil, width: 14 },
  {
    header: 'Frestur til úrbóta',
    value: (r) => r.correctionDeadline,
    width: 14,
  },
  { header: 'Ritstjóri', value: (r) => r.reviewerName, width: 24 },
  {
    header: 'Úrbótaáætlun fylgir',
    value: (r) => boolLabel(r.includesImprovementPlan),
    width: 12,
  },
  { header: 'Æðsti stjórnandi', value: (r) => r.companyAdminName, width: 26 },
  {
    header: 'Kyn æðsta stjórnanda',
    value: (r) =>
      r.companyAdminGender ? GENDER_LABEL[r.companyAdminGender] : null,
    width: 16,
  },
  { header: 'Tengiliður', value: (r) => r.contactName, width: 26 },
  { header: 'Netfang tengiliðs', value: (r) => r.contactEmail, width: 28 },

  // --- Launagreining. Salary reports only; blank on an equality plan. ---
  { header: 'Launatímabil', value: (r) => r.salaryDataPeriod, width: 14 },
  {
    header: 'Grundvöllur launagagna',
    value: (r) =>
      r.salaryDataBasis ? SALARY_DATA_BASIS_LABEL[r.salaryDataBasis] : null,
    width: 20,
  },
  {
    header: 'Starfsmenn karlar',
    value: (r) => r.counts?.male ?? null,
    width: 12,
  },
  {
    header: 'Starfsmenn konur',
    value: (r) => r.counts?.female ?? null,
    width: 12,
  },
  {
    header: 'Línur utan greiningar',
    value: (r) => r.counts?.excluded ?? null,
    width: 12,
  },
  {
    header: 'Meðaltímakaup karla',
    value: (r) => r.meanHourlyWageMale,
    width: 16,
  },
  {
    header: 'Meðaltímakaup kvenna',
    value: (r) => r.meanHourlyWageFemale,
    width: 16,
  },
  // ÓLEIÐRÉTTUR — the headline figure, not the regulated one. Named in full so
  // it cannot be mistaken for the figure the benchmark is tested against.
  {
    header: 'Óleiðréttur launamunur %',
    value: (r) => r.rawGapPercent,
    width: 16,
  },
  {
    header: 'Óleiðréttur launamunur hallar á',
    value: (r) =>
      r.rawGapDirection ? WAGE_GAP_DIRECTION_LABEL[r.rawGapDirection] : null,
    width: 16,
  },
  // LEIÐRÉTTUR/óskýrður — THE regulated figure. `oskyrtWithinBenchmark` beside
  // it is the compliance verdict and is NOT re-derived from this percentage:
  // the server evaluates it on the unrounded log gap.
  {
    header: 'Óskýrður launamunur %',
    value: (r) => r.oskyrtPercent,
    width: 16,
  },
  {
    header: 'Óskýrður launamunur hallar á',
    value: (r) =>
      r.oskyrtDirection ? WAGE_GAP_DIRECTION_LABEL[r.oskyrtDirection] : null,
    width: 16,
  },
  {
    header: 'Viðmið %',
    value: (r) => r.benchmarkPercent,
    width: 10,
  },
  {
    header: 'Innan viðmiðs',
    value: (r) =>
      r.oskyrtWithinBenchmark == null
        ? null
        : boolLabel(r.oskyrtWithinBenchmark),
    width: 12,
  },
  {
    header: 'Lágmarksmengi',
    value: (r) => r.minimumSetSize ?? null,
    width: 12,
  },
  {
    header: 'Reikniútgáfa',
    value: (r) => r.calculationVersion,
    width: 12,
  },
]
