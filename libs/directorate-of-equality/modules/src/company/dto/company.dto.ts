import { ApiPropertyOptional } from '@nestjs/swagger'

import {
  ApiBoolean,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

import {
  CompanyObligationStatusEnum,
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../models/company.enums'
import { IsatCategoryDto } from './isat-category.dto'

/**
 * Documents the hoisted `CompanyObligationStatusEnum` schema itself, as opposed
 * to either field that references it. See the note on `equalityObligationStatus`.
 */
const OBLIGATION_STATUS_SCHEMA_DESCRIPTION =
  "One reporting obligation's own state. NOT_REQUIRED means the company does not owe this report at all — it is the absence of an obligation, not a compliance failure. ACTION_PLAN_MISSING applies only to a salary report, which alone can be postponed pending outlier explanations."

export class CompanyDto {
  @ApiUUId()
  id!: string

  @ApiString()
  name!: string

  @ApiEnum(CompanySizeEnum, { enumName: 'CompanySizeEnum' })
  employeeCountCategory!: CompanySizeEnum

  @ApiString()
  nationalId!: string

  @ApiEnum(CompanyStatusEnum, { enumName: 'CompanyStatusEnum' })
  status!: CompanyStatusEnum

  @ApiOptionalString({
    nullable: true,
    description: 'Contact email for the company. Used by the deadline-reminder task.',
  })
  email!: string | null

  @ApiOptionalString({ nullable: true })
  address!: string | null

  @ApiOptionalUuid({ nullable: true })
  postcodeId!: string | null

  @ApiBoolean()
  salaryReportRequired!: boolean

  @ApiBoolean()
  salaryReportRequiredOverride!: boolean

  @ApiBoolean({
    description:
      'Daily-fines flag. `true` means the company is in the daily-fines process, handled outside this system.',
  })
  finesStarted!: boolean

  @ApiBoolean({
    description:
      'Admin halt switch. `true` means all outbound activity (scheduled jobs, emails, notifications) for the company is suspended.',
  })
  quarantined!: boolean

  @ApiOptionalDateTime({ nullable: true })
  nextEqualityReportDueAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  nextSalaryReportDueAt!: Date | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Normalized ÍSAT2008 leaf code (admin-owned statistics field), e.g. "01110".',
  })
  isatCategoryCode!: string | null

  @ApiPropertyOptional({ type: IsatCategoryDto, nullable: true })
  isatCategory!: IsatCategoryDto | null

  @ApiEnum(CompanySectorEnum, {
    enumName: 'CompanySectorEnum',
    description:
      'Ownership sector (private vs government/state), derived from the RSK legal form. UNKNOWN means unclassified — it does NOT mean private.',
  })
  sector!: CompanySectorEnum

  @ApiBoolean({
    description:
      'True when an admin set the sector by hand; a backfill must not overwrite it.',
  })
  sectorOverride!: boolean

  @ApiOptionalString({
    nullable: true,
    description: "RSK's raw legal-form code (rekstrarform), as returned.",
  })
  legalFormId!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      "RSK's raw legal-form name. Useful for seeing the form behind an UNKNOWN sector.",
  })
  legalFormName!: string | null

  @ApiEnum(CompanyReportStatusEnum, {
    enumName: 'CompanyReportStatusEnum',
    description:
      'Derived roll-up: the single most pressing compliance problem, in priority order. Drives the detail header, list sorting and the status filter. Collapses a company missing several obligations to one value — render per-obligation columns from `equalityObligationStatus` / `salaryObligationStatus` instead.',
  })
  reportStatus!: CompanyReportStatusEnum

  // ⚠️ `enumSchema` on both, and identical on both. NestJS hoists an `enumName`
  // into a shared schema and copies the FIRST property's `description` onto it,
  // so without this the shared enum would be documented as "the equality plan's
  // own state" — wrong for the type, and wrong for the salary field that also
  // references it. `enumSchema.description` documents the hoisted type;
  // `description` documents the field.
  @ApiEnum(CompanyObligationStatusEnum, {
    enumName: 'CompanyObligationStatusEnum',
    enumSchema: { description: OBLIGATION_STATUS_SCHEMA_DESCRIPTION },
    description:
      "Derived: the equality plan's own state. NOT_REQUIRED below 25 employees (and for UNKNOWN) with no salary obligation. Never ACTION_PLAN_MISSING — an equality report has no outlier groups and cannot be postponed.",
  })
  equalityObligationStatus!: CompanyObligationStatusEnum

  @ApiEnum(CompanyObligationStatusEnum, {
    enumName: 'CompanyObligationStatusEnum',
    enumSchema: { description: OBLIGATION_STATUS_SCHEMA_DESCRIPTION },
    description:
      "Derived: the salary report's own state. NOT_REQUIRED unless 50+ employees or an admin override. ACTION_PLAN_MISSING means the report was filed and sits in POSTPONED awaiting outlier explanations — it is a state of the report, so it is mutually exclusive with MISSING.",
  })
  salaryObligationStatus!: CompanyObligationStatusEnum

  @ApiBoolean({
    description:
      "Derived: the company owes an equality plan AND its next due date has passed. Gated on the obligation — the register load seeded due dates for companies of every size, so an ungated read marks companies below 25 as overdue against a plan they do not owe.",
  })
  equalityReportOverdue!: boolean

  @ApiBoolean({
    description:
      'Derived: the company owes a salary report AND its next due date has passed. Gated on the obligation, as above.',
  })
  salaryReportOverdue!: boolean

  @ApiBoolean({
    description:
      "Derived: the Directorate's retired SharePoint register holds at least one row for this company. Drives whether the detail view offers the legacy-data tab; says nothing about compliance — the row may record a lapsed or surrendered certificate.",
  })
  hasLegacyReports!: boolean
}
