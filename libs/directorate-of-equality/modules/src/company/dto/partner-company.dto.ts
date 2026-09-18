import {
  ApiBoolean,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalString,
  ApiString,
} from '@dmr.is/decorators'

import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
} from '../models/company.enums'
import { CompanyDto } from './company.dto'

/**
 * The company as a third-party integrator may see it.
 *
 * A deliberately narrow projection of `CompanyDto`, which is the BACK OFFICE's
 * view: 24 fields including the Directorate's own working state — the
 * daily-fines flag, the quarantine switch, whether an admin overrode the sector
 * or the salary-report requirement, RSK legal-form bookkeeping, and the primary
 * keys of rows a vendor can neither read nor reference. None of that is a
 * vendor's business, and several of those fields would be actively misleading
 * out of context (`sector: UNKNOWN` does not mean private; `hasLegacyReports`
 * says nothing about compliance).
 *
 * The register lifecycle status is deliberately NOT here, and that omission is
 * load-bearing rather than an oversight. It is the Directorate's own posture
 * toward its register — its one live consequence is that reminder emails stop —
 * and it is derived from absence from an ANNUAL import, so it can be a year out
 * of date. A vendor reading `INACTIVE` would reasonably hear "dissolved" when
 * it may only mean "missing from one sheet". An inactive company is refused
 * outright by `RequireActiveCompanyGuard` — every route, not only the
 * submissions — and that refusal's message carries the whole explanation
 * precisely because this field does not exist.
 *
 * The rule for what belongs here, in the absence of anything else to appeal to:
 * a field earns its place if an integrator can *act* on it — confirm the key
 * points at the right employer, prefill a submission, or decide whether and
 * when to file. Everything else is internal until someone asks for it, and
 * adding a field later is cheap while removing one is a breaking change.
 *
 * Written as a standalone class rather than a `PickType(CompanyDto, …)` on
 * purpose: the omission has to be the thing that breaks when a field is added
 * to `CompanyDto`, and a Pick that silently keeps working is how internal state
 * reaches a public surface. Adding a field to `CompanyDto` should leave this
 * file untouched, and that is the point.
 */
export class PartnerCompanyDto {
  @ApiString({ description: 'Kennitala of the company the API key belongs to.' })
  nationalId!: string

  @ApiString()
  name!: string

  @ApiOptionalString({
    nullable: true,
    description:
      'Registered address. Useful for prefilling the `company` snapshot a submission carries — that snapshot is what the report freezes, so it is submitted rather than looked up.',
  })
  address!: string | null

  @ApiEnum(CompanySizeEnum, {
    enumName: 'CompanySizeEnum',
    description:
      'Regulatory size bucket: SMALL 0–24, MEDIUM 25–49, LARGE 50+ employees, UNKNOWN when no headcount is on record. What obligations a company has follows from this — 25+ owes an equality report, 50+ also owes a salary report. UNKNOWN imposes none but does not assert the company is small.',
  })
  employeeCountCategory!: CompanySizeEnum

  @ApiBoolean({
    description:
      'Whether this company owes a salary report at all. True for 50+ employees, and for a smaller company the Directorate has explicitly required one.',
  })
  salaryReportRequired!: boolean

  @ApiEnum(CompanyReportStatusEnum, {
    enumName: 'CompanyReportStatusEnum',
    description:
      'What the company still owes, most critical first: `MISSING_EQUALITY_REPORT`, `MISSING_SALARY_REPORT`, `MISSING_ACTION_PLAN` (a salary report is filed but its outlier explanations are still deferred), or `SATISFACTORY`. Derived on read, so it reflects reports filed on any channel — not only through this API.',
  })
  reportStatus!: CompanyReportStatusEnum

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'When the next equality report is due. Null when no obligation is on record.',
  })
  nextEqualityReportDueAt!: Date | null

  @ApiOptionalDateTime({
    nullable: true,
    description:
      'When the next salary report is due. Null when no obligation is on record. The renewal window opens six months before this date — see the salary eligibility endpoint.',
  })
  nextSalaryReportDueAt!: Date | null

  @ApiBoolean({
    description:
      'The equality due date has passed. Derived server-side, so it does not depend on the caller’s clock or timezone.',
  })
  equalityReportOverdue!: boolean

  @ApiBoolean({
    description: 'The salary due date has passed. Derived server-side.',
  })
  salaryReportOverdue!: boolean
}

/**
 * Narrows the back-office view to the partner one.
 *
 * A function rather than a static on the DTO so the projection has one home and
 * shows up in a grep for either type. Every field is named explicitly; there is
 * no spread, so a new field on `CompanyDto` cannot arrive here by accident.
 */
export const toPartnerCompanyDto = (
  company: CompanyDto,
): PartnerCompanyDto => ({
  nationalId: company.nationalId,
  name: company.name,
  address: company.address,
  employeeCountCategory: company.employeeCountCategory,
  salaryReportRequired: company.salaryReportRequired,
  reportStatus: company.reportStatus,
  nextEqualityReportDueAt: company.nextEqualityReportDueAt,
  nextSalaryReportDueAt: company.nextSalaryReportDueAt,
  equalityReportOverdue: company.equalityReportOverdue,
  salaryReportOverdue: company.salaryReportOverdue,
})
