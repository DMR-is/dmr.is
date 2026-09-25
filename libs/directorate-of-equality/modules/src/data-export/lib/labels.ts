/**
 * Icelandic labels for the exported file.
 *
 * ⚠️ Deliberately a second copy of the wording the admin web renders, not a
 * shared source. The two cannot share one: the web's maps live in the Next app
 * and the API cannot import them. More to the point they answer different
 * questions — a column header in a spreadsheet has no surrounding UI to supply
 * the subject, so "Vantar" becomes "Vantar jafnréttisáætlun" here even though
 * the screen can afford the shorter form under a column heading.
 *
 * Every map is exhaustive over its enum (`Record<Enum, string>`), so adding a
 * member to any of these enums fails the build here rather than exporting a
 * blank cell.
 */

import {
  CompanyObligationStatusEnum,
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import { WageGapDirectionEnum } from '../../report/lib/wage-gap-decomposition'
import {
  CommunicationStatusEnum,
  EqualityCoverageSourceEnum,
  GenderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'

/**
 * The two things a company files. The whole taxonomy — there is no third kind,
 * and the retired vottun/staðfesting distinction is not one of these.
 */
export const REPORT_TYPE_LABEL: Record<ReportTypeEnum, string> = {
  [ReportTypeEnum.EQUALITY]: 'Jafnréttisáætlun',
  [ReportTypeEnum.SALARY]: 'Skýrslugjöf',
}

export const REPORT_STATUS_LABEL: Record<ReportStatusEnum, string> = {
  [ReportStatusEnum.DRAFT]: 'Drög',
  [ReportStatusEnum.SUBMITTED]: 'Innsend',
  [ReportStatusEnum.POSTPONED]: 'Frestað',
  [ReportStatusEnum.IN_REVIEW]: 'Í vinnslu',
  [ReportStatusEnum.DENIED]: 'Hafnað',
  [ReportStatusEnum.APPROVED]: 'Samþykkt',
  [ReportStatusEnum.SUPERSEDED]: 'Úrelt',
  [ReportStatusEnum.WITHDRAWN]: 'Afturkölluð',
}

export const COMMUNICATION_STATUS_LABEL: Record<
  CommunicationStatusEnum,
  string
> = {
  [CommunicationStatusEnum.NOT_STARTED]: 'Ekki hafin',
  [CommunicationStatusEnum.AWAITING_RESPONSE]: 'Bíður svars',
  [CommunicationStatusEnum.RESPONSE_RECEIVED]: 'Svar borist',
  [CommunicationStatusEnum.CLOSED]: 'Lokið',
}

export const EQUALITY_SOURCE_LABEL: Record<
  EqualityCoverageSourceEnum,
  string
> = {
  [EqualityCoverageSourceEnum.REPORT]: 'Skráð í þessu kerfi',
  [EqualityCoverageSourceEnum.LEGACY]: 'Úr eldra kerfi',
}

export const GENDER_LABEL: Record<GenderEnum, string> = {
  [GenderEnum.MALE]: 'Karl',
  [GenderEnum.FEMALE]: 'Kona',
  [GenderEnum.NEUTRAL]: 'Kynsegin/annað',
}

/**
 * Which gender a pay gap disfavours.
 *
 * ⚠️ A separate map from `GENDER_LABEL`, not a reuse of it. NONE is a real
 * member here and it is not a gender — it means the gap landed on zero, so
 * there is nobody it runs against. Rendering it through a gender map would
 * need a fourth "gender" and would put that word in a column that is about
 * direction.
 */
export const WAGE_GAP_DIRECTION_LABEL: Record<WageGapDirectionEnum, string> = {
  [WageGapDirectionEnum.MALE]: 'Körlum',
  [WageGapDirectionEnum.FEMALE]: 'Konum',
  [WageGapDirectionEnum.NONE]: 'Hvorugu',
}

export const SALARY_DATA_BASIS_LABEL: Record<SalaryDataBasisEnum, string> = {
  [SalaryDataBasisEnum.MONTH]: 'Einn mánuður',
  [SalaryDataBasisEnum.AVERAGE]: 'Meðaltal 12 mánaða',
}

/**
 * Employee-count buckets. The numbers, not the enum names — a spreadsheet
 * column reading "MEDIUM" tells a reader nothing about where the obligation
 * thresholds sit, and 25 and 50 are the whole point of the buckets.
 */
export const COMPANY_SIZE_LABEL: Record<CompanySizeEnum, string> = {
  [CompanySizeEnum.UNKNOWN]: 'Óþekkt',
  [CompanySizeEnum.SMALL]: '0–24',
  [CompanySizeEnum.MEDIUM]: '25–49',
  [CompanySizeEnum.LARGE]: '50+',
}

/**
 * All five sectors, kept separate.
 *
 * Ráðuneyti and Ríkisaðilar are NOT collapsed into one "ríkið" bucket even
 * though the Directorate's published dashboard shows three sectors rather than
 * five. Folding them is a presentation choice, and a reader can always sum two
 * columns; nobody can split one back apart.
 */
export const COMPANY_SECTOR_LABEL: Record<CompanySectorEnum, string> = {
  [CompanySectorEnum.UNKNOWN]: 'Óflokkað',
  [CompanySectorEnum.FYRIRTAEKI]: 'Fyrirtæki',
  [CompanySectorEnum.RADUNEYTI]: 'Ráðuneyti',
  [CompanySectorEnum.RIKISADILI]: 'Ríkisaðilar',
  [CompanySectorEnum.SVEITARFELAG]: 'Sveitarfélög',
}

export const COMPANY_STATUS_LABEL: Record<CompanyStatusEnum, string> = {
  [CompanyStatusEnum.ACTIVE]: 'Virkt',
  [CompanyStatusEnum.INACTIVE]: 'Óvirkt',
}

export const COMPANY_REPORT_STATUS_LABEL: Record<
  CompanyReportStatusEnum,
  string
> = {
  [CompanyReportStatusEnum.MISSING_EQUALITY_REPORT]: 'Vantar jafnréttisáætlun',
  [CompanyReportStatusEnum.MISSING_SALARY_REPORT]: 'Vantar skýrslugjöf',
  [CompanyReportStatusEnum.MISSING_ACTION_PLAN]: 'Vantar úrbótaáætlun',
  [CompanyReportStatusEnum.SATISFACTORY]: 'Fullnægjandi',
}

/**
 * Per-obligation state. Spelled out rather than the screen's bare "Vantar":
 * the two obligation columns sit side by side in the sheet and a reader
 * sorting on one of them loses the header context the screen provides.
 */
export const OBLIGATION_STATUS_LABEL: Record<
  CompanyObligationStatusEnum,
  string
> = {
  [CompanyObligationStatusEnum.NOT_REQUIRED]: 'Á ekki við',
  [CompanyObligationStatusEnum.MISSING]: 'Vantar',
  [CompanyObligationStatusEnum.ACTION_PLAN_MISSING]: 'Vantar úrbótaáætlun',
  [CompanyObligationStatusEnum.COVERED]: 'Í gildi',
}

/** Yes/no for a boolean column. */
export const boolLabel = (value: boolean): string => (value ? 'Já' : 'Nei')
