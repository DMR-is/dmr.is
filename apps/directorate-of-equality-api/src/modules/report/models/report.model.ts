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

import { DoeModels } from '../../../core/constants'
import { CompanyReportModel } from '../../company/models/company-report.model'
import { ReportResultModel } from '../../report-result/models/report-result.model'
import { UserModel } from '../../user/models/user.model'
import type { EqualityReportDto } from '../dto/equality-report.dto'
import type { ReportDto } from '../dto/report.dto'
import { ReportListItemDto } from '../dto/report-list-item.dto'
import {
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from './report.enums'
import { ReportCommentModel } from './report-comment.model'

// Re-export for backwards compatibility — many callers import these enums
// from `report.model.ts` directly. New code should prefer `report.enums.ts`.
export {
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from './report.enums'

type ReportAttributes = {
  type: ReportTypeEnum
  status: ReportStatusEnum

  companyAdminName: string | null
  companyAdminEmail: string | null
  companyAdminGender: GenderEnum | null

  contactName: string | null
  companyNationalId: string | null
  contactEmail: string | null
  contactPhone: string | null

  averageEmployeeMaleCount: number | null
  averageEmployeeFemaleCount: number | null
  averageEmployeeNeutralCount: number | null

  providerType: ReportProviderEnum | null
  providerId: string | null
  importedFromExcel: boolean
  identifier: string | null
  outliersPostponed: boolean

  equalityReportId: string | null
  reviewerUserId: string | null

  approvedAt: Date | null
  validUntil: Date | null
  correctionDeadline: Date | null
  equalityReportContent: string | null
  finesStartedAt: Date | null
}

type ReportCreateAttributes = {
  type: ReportTypeEnum
  status?: ReportStatusEnum

  companyAdminName?: string | null
  companyAdminEmail?: string | null
  companyAdminGender?: GenderEnum | null

  contactName?: string | null
  companyNationalId?: string | null
  contactEmail?: string | null
  contactPhone?: string | null

  averageEmployeeMaleCount?: number | null
  averageEmployeeFemaleCount?: number | null
  averageEmployeeNeutralCount?: number | null

  providerType?: ReportProviderEnum | null
  providerId?: string | null
  importedFromExcel?: boolean
  identifier?: string | null
  outliersPostponed?: boolean

  equalityReportId?: string | null
  reviewerUserId?: string | null

  approvedAt?: Date | null
  validUntil?: Date | null
  correctionDeadline?: Date | null
  equalityReportContent?: string | null
  finesStartedAt?: Date | null
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
 */
@Scopes(() => ({
  listview: {
    include: [
      { model: CompanyReportModel, as: 'companyReport', required: false },
      { model: UserModel, as: 'reviewer', required: false },
    ],
  },
  detailed: {
    include: [
      { model: CompanyReportModel, as: 'companyReport', required: true },
      { model: UserModel, as: 'reviewer', required: false },
      {
        model: ReportCommentModel,
        as: 'comments',
        required: false,
        separate: true,
        order: [['createdAt', 'DESC']],
      },
      // Salary-only aggregate — null for equality reports. Per-role
      // breakdown + employee outliers are loaded via separate queries
      // in the service (keyed off `result.id` and `report.id`) to avoid
      // modifying the report-result / report-employee modules owned by
      // teammates.
      { model: ReportResultModel, as: 'result', required: false },
    ],
  },
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

  @Column({ type: DataType.TEXT, allowNull: true, field: 'company_admin_name' })
  companyAdminName!: string | null

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

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'outliers_postponed',
  })
  outliersPostponed!: boolean

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

  @Column({ type: DataType.DATE, allowNull: true, field: 'fines_started_at' })
  finesStartedAt!: Date | null

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

  static fromModel(model: ReportModel): ReportDto {
    return {
      id: model.id,
      type: model.type,
      status: model.status,
      companyAdminName: model.companyAdminName,
      companyAdminEmail: model.companyAdminEmail,
      companyAdminGender: model.companyAdminGender,
      contactName: model.contactName,
      companyNationalId: model.companyNationalId,
      contactEmail: model.contactEmail,
      contactPhone: model.contactPhone,
      averageEmployeeMaleCount: model.averageEmployeeMaleCount,
      averageEmployeeFemaleCount: model.averageEmployeeFemaleCount,
      averageEmployeeNeutralCount: model.averageEmployeeNeutralCount,
      providerType: model.providerType,
      providerId: model.providerId,
      importedFromExcel: model.importedFromExcel,
      identifier: model.identifier,
      outliersPostponed:
        model.type === ReportTypeEnum.SALARY ? model.outliersPostponed : null,
      equalityReportId: model.equalityReportId,
      reviewerUserId: model.reviewerUserId,
      approvedAt: model.approvedAt,
      validUntil: model.validUntil,
      correctionDeadline: model.correctionDeadline,
      equalityReportContent: model.equalityReportContent,
      finesStartedAt: model.finesStartedAt,
      reviewer:
        model.reviewer === undefined
          ? undefined
          : model.reviewer === null
            ? null
            : UserModel.fromModel(model.reviewer),
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

  static fromModelToListItem(model: ReportModel): ReportListItemDto {
    return {
      id: model.id,
      identifier: model.identifier,
      type: model.type,
      status: model.status,
      companyName: model.companyReport?.name ?? null,
      companyNationalId: model.companyReport?.nationalId ?? null,
      reviewer: model.reviewer ? UserModel.fromModel(model.reviewer) : null,
      createdAt: model.createdAt,
      correctionDeadline: model.correctionDeadline,
      validUntil: model.validUntil,
    }
  }

  fromModelToEqualityReport(): EqualityReportDto {
    return ReportModel.fromModelToEqualityReport(this)
  }

  fromModelToListItem(): ReportListItemDto {
    return ReportModel.fromModelToListItem(this)
  }

  fromModel(): ReportDto {
    return ReportModel.fromModel(this)
  }
}
