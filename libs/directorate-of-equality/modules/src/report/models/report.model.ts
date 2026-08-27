import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Scopes,
} from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { CompanyModel } from '../../company/models/company.model'
import { CompanyReportModel } from '../../company/models/company-report.model'
import { DoeModels } from '../../constants'
import { ReportCommentModel } from '../../report-comment/models/report-comment.model'
import { ReportResultModel } from '../../report-result/models/report-result.model'
import { UserModel } from '../../user/models/user.model'
import type { EqualityReportDto } from '../dto/equality-report.dto'
import type { EqualityReportSummaryDto } from '../dto/equality-report-summary.dto'
import type { ReportDto } from '../dto/report.dto'
import { ReportListItemDto } from '../dto/report-list-item.dto'
import {
  CommunicationStatusEnum,
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from './report.enums'

// Re-export for backwards compatibility — many callers import these enums
// from `report.model.ts` directly. New code should prefer `report.enums.ts`.
export {
  CommunicationStatusEnum,
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from './report.enums'

type ReportAttributes = {
  type: ReportTypeEnum
  status: ReportStatusEnum
  communicationStatus: CommunicationStatusEnum

  companyAdminName: string | null
  companyAdminTitle: string | null
  companyAdminEmail: string | null
  companyAdminGender: GenderEnum | null

  contactName: string | null
  companyNationalId: string | null
  contactEmail: string | null
  contactPhone: string | null

  averageEmployeeMaleCount: number | null
  averageEmployeeFemaleCount: number | null
  averageEmployeeNeutralCount: number | null

  salaryDataBasis: SalaryDataBasisEnum | null
  salaryDataPeriod: string | null

  providerType: ReportProviderEnum | null
  providerId: string | null
  importedFromExcel: boolean
  identifier: string | null

  equalityReportId: string | null
  reviewerUserId: string | null

  approvedAt: Date | null
  validUntil: Date | null
  correctionDeadline: Date | null
  equalityReportContent: string | null
}

type ReportCreateAttributes = {
  type: ReportTypeEnum
  status?: ReportStatusEnum
  communicationStatus?: CommunicationStatusEnum

  companyAdminName?: string | null
  companyAdminTitle?: string | null
  companyAdminEmail?: string | null
  companyAdminGender?: GenderEnum | null

  contactName?: string | null
  companyNationalId?: string | null
  contactEmail?: string | null
  contactPhone?: string | null

  averageEmployeeMaleCount?: number | null
  averageEmployeeFemaleCount?: number | null
  averageEmployeeNeutralCount?: number | null

  salaryDataBasis?: SalaryDataBasisEnum | null
  salaryDataPeriod?: string | null

  providerType?: ReportProviderEnum | null
  providerId?: string | null
  importedFromExcel?: boolean
  identifier?: string | null

  equalityReportId?: string | null
  reviewerUserId?: string | null

  approvedAt?: Date | null
  validUntil?: Date | null
  correctionDeadline?: Date | null
  equalityReportContent?: string | null
}

/**
 * Sequelize scopes bundle the include shapes for common read patterns.
 * Filters / sort / pagination stay on the caller — those are dynamic per
 * request — but the relation graph is the same every time, so it lives
 * here.
 *
 * - `listview`: trimmed relations for the admin list table — company
 *   snapshot (drives the name/kennitala columns) and reviewer.
 * - `detailed`: everything the detail screen needs — same includes as
 *   listview plus comments, newest-first, not paranoid-deleted.
 * - `forCompany(companyId)`: the company-detail reports tab — reports that
 *   include this specific company, joined on its OWN snapshot row.
 */
@Scopes(() => ({
  listview: {
    include: [
      // Parent snapshot only — a multi-company report has one `company_report`
      // row per company (parent + subsidiaries). Without the parent filter the
      // join multiplies report rows (one per subsidiary), surfacing the same
      // report multiple times in the list.
      {
        model: CompanyReportModel,
        as: 'companyReport',
        required: false,
        where: { parentCompanyId: null },
        include: [{ model: CompanyModel, as: 'company', required: false }],
      },
      { model: UserModel, as: 'reviewer', required: false },
    ],
  },
  detailed: {
    include: [
      // Parent snapshot only — see listview note. The detail view loads
      // subsidiaries separately via `loadSubsidiaries`.
      {
        model: CompanyReportModel,
        as: 'companyReport',
        required: true,
        where: { parentCompanyId: null },
        include: [{ model: CompanyModel, as: 'company', required: false }],
      },
      { model: UserModel, as: 'reviewer', required: false },
      {
        model: ReportCommentModel,
        as: 'comments',
        required: false,
        separate: true,
        order: [['createdAt', 'DESC']],
        include: [{ model: UserModel, as: 'author', required: false }],
      },
      // Salary-only aggregate — null for equality reports. Per-role
      // breakdown + employee outliers are loaded via separate queries
      // in the service (keyed off `result.id` and `report.id`) to avoid
      // modifying the report-result / report-employee modules owned by
      // teammates.
      { model: ReportResultModel, as: 'result', required: false },
    ],
  },
  // Company-scoped list for the company-detail reports tab. Joins the
  // company's OWN `company_report` row — the parent submission when the
  // company filed on its own behalf (`parentCompanyId` null), or the
  // subsidiary row when it was included on a parent's group submission
  // (`parentCompanyId` set). Filtering the join to one company means at most
  // one snapshot matches per report, so each report appears once WITHOUT the
  // parent-only pinning `listview` needs — that pin exists only because the
  // unfiltered list join would otherwise multiply a group report into one row
  // per company. `fromModelToListItem` reads `companyReport.name` etc, so the
  // `company` include is kept for the fines/quarantine flags.
  forCompany: (companyId: string) => ({
    include: [
      {
        model: CompanyReportModel,
        as: 'companyReport',
        required: true,
        where: { companyId },
        include: [{ model: CompanyModel, as: 'company', required: false }],
      },
      { model: UserModel, as: 'reviewer', required: false },
    ],
  }),
}))
@MutableTable({ tableName: DoeModels.REPORT })
export class ReportModel extends MutableModel<
  ReportAttributes,
  ReportCreateAttributes
> {
  @Column({
    type: DataType.ENUM(...Object.values(ReportTypeEnum)),
    allowNull: false,
  })
  type!: ReportTypeEnum

  @Column({
    type: DataType.ENUM(...Object.values(ReportStatusEnum)),
    allowNull: false,
    defaultValue: ReportStatusEnum.DRAFT,
  })
  status!: ReportStatusEnum

  @Column({
    type: DataType.ENUM(...Object.values(CommunicationStatusEnum)),
    allowNull: false,
    defaultValue: CommunicationStatusEnum.NOT_STARTED,
    field: 'communication_status',
  })
  communicationStatus!: CommunicationStatusEnum

  @Column({ type: DataType.TEXT, allowNull: true, field: 'company_admin_name' })
  companyAdminName!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'company_admin_title',
  })
  companyAdminTitle!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'company_admin_email',
  })
  companyAdminEmail!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(GenderEnum)),
    allowNull: true,
    field: 'company_admin_gender',
  })
  companyAdminGender!: GenderEnum | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'contact_name' })
  contactName!: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'company_national_id',
  })
  companyNationalId!: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'contact_email' })
  contactEmail!: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'contact_phone' })
  contactPhone!: string | null

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    field: 'average_employee_male_count',
    get() {
      const value = this.getDataValue('averageEmployeeMaleCount')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  averageEmployeeMaleCount!: number | null

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    field: 'average_employee_female_count',
    get() {
      const value = this.getDataValue('averageEmployeeFemaleCount')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  averageEmployeeFemaleCount!: number | null

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    field: 'average_employee_neutral_count',
    get() {
      const value = this.getDataValue('averageEmployeeNeutralCount')
      return value !== null && value !== undefined
        ? parseFloat(value as unknown as string)
        : null
    },
  })
  averageEmployeeNeutralCount!: number | null

  /**
   * Salary-only. Whether the submitted figures describe one specific payroll
   * month or a twelve-month average. Declared by the submittee and mandatory on
   * a submitted salary report — nullable here because equality reports carry no
   * salary data, a draft is filled in field by field, and pre-existing reports
   * predate the field.
   */
  @Column({
    type: DataType.ENUM(...Object.values(SalaryDataBasisEnum)),
    allowNull: true,
    field: 'salary_data_basis',
  })
  salaryDataBasis!: SalaryDataBasisEnum | null

  /**
   * The payroll month the data is based on, as `YYYY-MM-01` — the value has
   * month precision, so it is always stored on the 1st (DB CHECK constraint).
   * Set when `salaryDataBasis` is MONTH, null for AVERAGE.
   */
  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'salary_data_period',
  })
  salaryDataPeriod!: string | null

  @Column({
    type: DataType.ENUM(...Object.values(ReportProviderEnum)),
    allowNull: true,
    field: 'provider_type',
  })
  providerType!: ReportProviderEnum | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'provider_id' })
  providerId!: string | null

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'imported_from_excel',
  })
  importedFromExcel!: boolean

  @Column({ type: DataType.TEXT, allowNull: true })
  identifier!: string | null

  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'equality_report_id' })
  equalityReportId!: string | null

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'reviewer_user_id' })
  reviewerUserId!: string | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'approved_at' })
  approvedAt!: Date | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'valid_until' })
  validUntil!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'correction_deadline',
  })
  correctionDeadline!: Date | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'equality_report_content',
  })
  equalityReportContent!: string | null

  @BelongsTo(() => ReportModel, {
    foreignKey: 'equalityReportId',
    as: 'equalityReport',
  })
  equalityReport?: ReportModel | null

  @BelongsTo(() => UserModel, { foreignKey: 'reviewerUserId', as: 'reviewer' })
  reviewer?: UserModel | null

  // One-to-one snapshot of company info taken when the report is created.
  // Declared HasOne because the immutable snapshot is created once per report.
  @HasOne(() => CompanyReportModel, {
    foreignKey: 'reportId',
    as: 'companyReport',
  })
  companyReport?: CompanyReportModel

  @HasMany(() => ReportCommentModel, { foreignKey: 'reportId', as: 'comments' })
  comments?: ReportCommentModel[]

  @HasOne(() => ReportResultModel, { foreignKey: 'reportId', as: 'result' })
  result?: ReportResultModel | null

  /**
   * Slim, applicant-facing view of an equality report.
   *
   * `providerId` is only surfaced for island.is-originated reports: it is the
   * handle `GET /application/reports/:providerId` resolves against, and that
   * route filters on `providerType = ISLAND_IS`. An admin- or Excel-created
   * report has no applicant-facing content route, so the handle is null rather
   * than a value the caller would only ever 404 on.
   */
  static toEqualitySummary(model: ReportModel): EqualityReportSummaryDto {
    return {
      id: model.id,
      identifier: model.identifier,
      providerId:
        model.providerType === ReportProviderEnum.ISLAND_IS
          ? model.providerId
          : null,
      approvedAt: model.approvedAt,
      validUntil: model.validUntil,
    }
  }

  static fromModel(model: ReportModel): ReportDto {
    return {
      id: model.id,
      type: model.type,
      status: model.status,
      communicationStatus: model.communicationStatus,
      companyAdminName: model.companyAdminName,
      companyAdminTitle: model.companyAdminTitle,
      companyAdminEmail: model.companyAdminEmail,
      companyAdminGender: model.companyAdminGender,
      contactName: model.contactName,
      companyNationalId: model.companyNationalId,
      contactEmail: model.contactEmail,
      contactPhone: model.contactPhone,
      averageEmployeeMaleCount: model.averageEmployeeMaleCount,
      averageEmployeeFemaleCount: model.averageEmployeeFemaleCount,
      averageEmployeeNeutralCount: model.averageEmployeeNeutralCount,
      salaryDataBasis: model.salaryDataBasis,
      salaryDataPeriod: model.salaryDataPeriod,
      providerType: model.providerType,
      providerId: model.providerId,
      importedFromExcel: model.importedFromExcel,
      identifier: model.identifier,
      outliersPostponed:
        model.type === ReportTypeEnum.SALARY
          ? model.status === ReportStatusEnum.POSTPONED
          : null,
      equalityReportId: model.equalityReportId,
      reviewerUserId: model.reviewerUserId,
      approvedAt: model.approvedAt,
      validUntil: model.validUntil,
      correctionDeadline: model.correctionDeadline,
      equalityReportContent: model.equalityReportContent,
      reviewer:
        model.reviewer === undefined
          ? undefined
          : model.reviewer === null
            ? null
            : UserModel.fromModel(model.reviewer),
      createdAt: model.createdAt
    }
  }

  /**
   * Project this report's fields into the `EqualityReportDto` shape — the
   * uniform equality-content block every detail view carries. Used in two
   * places by the service:
   *
   * - Equality-type reports → project themselves (self-reference, cheap).
   * - Salary-type reports   → project the *linked* equality report loaded
   *                           via `equalityReportId`.
   *
   * Kept as a static on the model so it lives next to `fromModel` — it IS
   * a DTO projection, just a different shape, and follows the same pattern.
   */
  static fromModelToEqualityReport(model: ReportModel): EqualityReportDto {
    return {
      id: model.id,
      identifier: model.identifier,
      status: model.status,
      content: model.equalityReportContent,
      approvedAt: model.approvedAt,
      validUntil: model.validUntil,
      correctionDeadline: model.correctionDeadline,
    }
  }

  static fromModelToListItem(
    model: ReportModel,
    includesImprovementPlan = false,
  ): ReportListItemDto {
    return {
      id: model.id,
      identifier: model.identifier,
      type: model.type,
      status: model.status,
      communicationStatus: model.communicationStatus,
      companyName: model.companyReport?.name ?? null,
      companyNationalId: model.companyReport?.nationalId ?? null,
      companyIsatCategory: model.companyReport?.isatCategory ?? null,
      companyEmployeeCountCategory:
        model.companyReport?.employeeCountCategory ?? null,
      companyAdminName: model.companyAdminName,
      companyAdminTitle: model.companyAdminTitle,
      companyAdminEmail: model.companyAdminEmail,
      companyAdminGender: model.companyAdminGender,
      reviewer: model.reviewer ? UserModel.fromModel(model.reviewer) : null,
      companyFinesStarted: model.companyReport?.company?.finesStarted ?? false,
      companyQuarantined: model.companyReport?.company?.quarantined ?? false,
      includesImprovementPlan,
      createdAt: model.createdAt,
      correctionDeadline: model.correctionDeadline,
      validUntil: model.validUntil,
    }
  }

  fromModelToEqualityReport(): EqualityReportDto {
    return ReportModel.fromModelToEqualityReport(this)
  }

  fromModelToListItem(includesImprovementPlan = false): ReportListItemDto {
    return ReportModel.fromModelToListItem(this, includesImprovementPlan)
  }

  fromModel(): ReportDto {
    return ReportModel.fromModel(this)
  }
}
