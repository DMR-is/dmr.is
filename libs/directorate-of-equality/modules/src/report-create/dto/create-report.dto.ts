import { ArrayMinSize, IsInt } from 'class-validator'

import {
  ApiArray,
  ApiBoolean,
  ApiDto,
  ApiDtoArray,
  ApiEnum,
  ApiNumber,
  ApiOptionalBoolean,
  ApiOptionalDtoArray,
  ApiOptionalString,
  ApiOptionalUUID,
  ApiString,
  ApiUUID,
} from '@dmr.is/decorators'

import {
  GenderEnum,
  ReportProviderEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'
import { ParsedReportDto } from '../../report-excel/dto/parsed-report.dto'

/**
 * One outlier group the company defined after the salary-analysis preview step
 * (see `db/README.md` Notes / open questions). Persisted into
 * `report_outlier_group`, with one `report_employee_outlier` row per covered
 * employee pointing at it.
 *
 * Only used when the parent report is NOT postponed — see
 * `CreateReportDto.outliersPostponed`. The applicant supplies the shared
 * explanation (all five fields required; the four texts non-empty) plus the
 * ordinals of the detected outliers this group covers. Across all groups every detected
 * outlier must be covered by exactly one group (validated server-side). When
 * the parent is postponed, no groups are created — the outlier rows are
 * written with `group_id = NULL` and resolved later via the outliers edit
 * endpoint.
 */
export class CreateReportOutlierGroupDto {
  @ApiOptionalString({
    description:
      'Applicant-supplied label for the group. Not required to be unique. When omitted (the implicit single-group case) the server assigns a default name.',
  })
  name?: string

  @ApiString({ minLength: 1 })
  reason!: string

  @ApiString({ minLength: 1 })
  action!: string

  @ApiString({ minLength: 1 })
  signatureName!: string

  @ApiString({ minLength: 1 })
  signatureRole!: string

  @ApiString({
    format: 'date',
    example: '2027-03-01',
    description:
      'Date the company commits to having this group’s improvements completed by ("Dagsetning úrbóta"), as `YYYY-MM-DD`. Required alongside the rest of the explanation. Must be in the future and no more than three years out — the next reporting cycle, beyond which the date belongs to a period this report cannot speak for.',
  })
  remedyDate!: string

  @ApiArray({
    type: [Number],
    description:
      'Ordinals of the employees in `parsed.employees[]` this group covers.',
  })
  @ArrayMinSize(1)
  @IsInt({ each: true })
  employeeOrdinals!: number[]
}

export class CreateReportCompanySnapshotDto {
  @ApiUUID({ description: 'FK to the live company row' })
  companyId!: string

  @ApiOptionalUUID({
    nullable: true,
    description:
      'Parent company FK (nullable). Null on the top-level reporting company; set on each subsidiary.',
  })
  parentCompanyId!: string | null

  @ApiString()
  name!: string

  @ApiString()
  nationalId!: string

  @ApiString()
  address!: string

  @ApiString()
  city!: string

  @ApiString()
  postcode!: string

  @ApiString()
  isatCategory!: string
}

/**
 * Request body for `POST /api/v1/reports/salary`. Combines submission
 * metadata that the application/auth context owns with the parsed workbook
 * payload that `POST /api/v1/reports/excel/import` returned earlier.
 *
 * The report identifier is not part of this payload: it is a meaningless
 * pseudonymous handle, minted by `ReportCreateService` when the row is created.
 *
 * `identifier` was accepted here until #1406 — see db/README.md → "Report
 * identifier" for the island.is client change that pairs with its removal.
 */
export class CreateReportDto {
  // `ApiOptionalUUID`, not `ApiUUID`: the latter is `ApiProperty` + `IsUUID()`
  // with no `IsOptional()`, so making the field optional in TypeScript alone
  // left the validator demanding it. `POST report-create/salary` takes this DTO
  // as a live `@Body()` behind the global pipe, so omitting the field — exactly
  // what the description invites — failed with a 400 before any resolution ran.
  // The partner path never noticed: it builds the DTO server-side and never
  // crosses the pipe.
  @ApiOptionalUUID({
    description:
      'FK to the approved EQUALITY report this salary was audited against. Omit it to have the creation service resolve the company’s active one — which is what the partner API does, since its contract does not carry the field.',
  })
  equalityReportId?: string

  @ApiBoolean()
  importedFromExcel!: boolean

  @ApiEnum(ReportProviderEnum)
  providerType!: ReportProviderEnum

  @ApiOptionalString({ nullable: true })
  providerId!: string | null

  @ApiString()
  companyAdminName!: string

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company executive.',
  })
  companyAdminTitle?: string | null

  @ApiString()
  companyAdminEmail!: string

  @ApiEnum(GenderEnum)
  companyAdminGender!: GenderEnum

  @ApiString()
  contactName!: string

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company contact (tengiliður).',
  })
  contactTitle?: string | null

  @ApiString()
  contactEmail!: string

  @ApiString()
  contactPhone!: string

  @ApiNumber()
  averageEmployeeMaleCount!: number

  @ApiNumber()
  averageEmployeeFemaleCount!: number

  @ApiNumber()
  averageEmployeeNeutralCount!: number

  @ApiEnum(SalaryDataBasisEnum, {
    enumName: 'SalaryDataBasisEnum',
    description:
      'Whether the salary data describes one specific payroll month (`MONTH`) or a twelve-month average (`AVERAGE`). Required — the submittee declares it.',
  })
  salaryDataBasis!: SalaryDataBasisEnum

  @ApiOptionalString({
    nullable: true,
    description:
      'The payroll month the data is based on, as an ISO date (`YYYY-MM-DD`; any day within the month is accepted and normalised to the 1st). Required when `salaryDataBasis` is `MONTH`, ignored (stored as null) for `AVERAGE`. Must name a month that has already happened, no earlier than 36 months ago.',
  })
  salaryDataPeriod?: string | null

  @ApiDto(ParsedReportDto, {
    description:
      'Parsed workbook payload from `POST /reports/excel/import`. Contains the criteria tree, role list, and employee rows.',
  })
  parsed!: ParsedReportDto

  /**
   * One snapshot row per participating company. Multi-company submissions
   * carry the parent on the first row (`parentCompanyId = null`) and each
   * subsidiary as a follow-up row pointing at the parent's `companyId`.
   */
  @ApiDtoArray(CreateReportCompanySnapshotDto)
  @ArrayMinSize(1)
  companies!: CreateReportCompanySnapshotDto[]

  /**
   * All-or-none. When true, the company is acknowledging every detected
   * outlier but deferring the explanations — `outlierGroups` is ignored and no
   * groups are created. The outlier rows are written with `group_id = NULL`
   * and resolved later via the outliers edit endpoint. When false (default),
   * `outlierGroups` must cover every detected outlier exactly once.
   */
  @ApiOptionalBoolean({
    description:
      'When true, defers every outlier explanation on this report. Defaults to false.',
  })
  outliersPostponed?: boolean

  /**
   * Postpone only if there turns out to be something to postpone.
   *
   * `outliersPostponed` is a caller who already knows the answer: the island.is
   * portal ran the preview, showed the applicant their outliers, and the
   * applicant pressed "explain later". A caller that has not previewed cannot
   * fill that flag in honestly — set it and a clean payroll is refused
   * ("cannot postpone nothing"), leave it and an unexplained outlier is refused
   * too. Neither answer is available before detection has run, and detection
   * runs here.
   *
   * So this asks the question the other way round: **if** outliers are detected
   * and no groups were supplied, file `POSTPONED` with the default group rather
   * than rejecting; if none are detected, file normally. It changes no outcome
   * the caller could have reached by setting `outliersPostponed` correctly — it
   * removes the need to know in advance, which is what lets the partner channel
   * send the payroll once instead of previewing first and submitting second.
   *
   * Ignored when `outlierGroups` are supplied: explaining outliers is always a
   * complete answer, and the partition is validated as usual. Ignored when
   * `outliersPostponed` is already true, which says the same thing unconditionally.
   */
  @ApiOptionalBoolean({
    description:
      'When true, a report whose outliers are detected but unexplained is filed as POSTPONED rather than refused, and one whose payroll is clean is filed normally. For callers that cannot preview before submitting. Defaults to false.',
  })
  postponeUnexplainedOutliers?: boolean

  /**
   * Let a new filing replace a `POSTPONED` one instead of colliding with it.
   *
   * A pending sibling normally blocks: `SUBMITTED` is withdrawn and replaced,
   * but `POSTPONED` and `IN_REVIEW` both answer `409`. That is right where
   * `POSTPONED` is a deliberate act — the island.is applicant pressed "explain
   * later", so being told to finish it is the correct answer.
   *
   * It is wrong where `POSTPONED` is simply what a submission with outliers
   * *becomes*. A caller that files, lands `POSTPONED`, and then finds an error
   * in the payroll would otherwise have to explain outliers it already knows are
   * wrong — purely to reach a state it is allowed to replace — and only then
   * file the correction. This flag says: treat a `POSTPONED` sibling the way a
   * `SUBMITTED` one is treated, and withdraw it.
   *
   * **`IN_REVIEW` still collides**, with or without this, and that is not an
   * oversight: a reviewer is mid-workflow on that report, and withdrawing it
   * under them is a different act from replacing something nobody has picked up.
   *
   * A flag rather than a rule keyed on `providerType`: the behaviour is asked
   * for by the caller that wants it, not inferred from which channel a report
   * arrived on — so reading either path tells you what it does without knowing
   * the other exists.
   */
  @ApiOptionalBoolean({
    description:
      'When true, a POSTPONED report for the same company is withdrawn and replaced by this one rather than answering 409. An IN_REVIEW report still conflicts. Defaults to false.',
  })
  withdrawPostponedSibling?: boolean

  /**
   * Outlier groups the company has defined. Required (non-empty) when the
   * report has detected outliers and is not postponed: the union of each
   * group's `employeeOrdinals` must cover every detected outlier exactly once.
   * Ignored when `outliersPostponed` is true. Omit when no outliers were
   * detected — or, with `postponeUnexplainedOutliers`, omit to postpone them.
   */
  @ApiOptionalDtoArray(CreateReportOutlierGroupDto)
  outlierGroups?: CreateReportOutlierGroupDto[]
}
