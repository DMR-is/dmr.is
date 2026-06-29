import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Scopes,
} from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { PostcodeModel } from '../../location/models/postcode.model'
import type { CreateReportCompanySnapshotDto } from '../../report-create/dto/create-report.dto'
import type { CompanyDto } from '../dto/company.dto'
import {
  companyReportStatusLiteral,
  equalityReportOverdueLiteral,
  salaryReportOverdueLiteral,
} from '../utils/report-status'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from './company.enums'
import { IsatCategoryModel } from './isat-category.model'

type CompanyAttributes = {
  name: string
  employeeCountCategory: CompanySizeEnum
  nationalId: string
  status: CompanyStatusEnum
  email: string | null
  address: string | null
  postcodeId: string | null
  salaryReportRequired: boolean
  salaryReportRequiredOverride: boolean
  finesStarted: boolean
  quarantined: boolean
  nextEqualityReportDueAt: Date | null
  nextSalaryReportDueAt: Date | null
  isatCategoryCode: string | null
}

type CompanyCreateAttributes = {
  name: string
  employeeCountCategory: CompanySizeEnum
  nationalId: string
  status?: CompanyStatusEnum
  email?: string | null
  address?: string | null
  postcodeId?: string | null
  salaryReportRequired?: boolean
  salaryReportRequiredOverride?: boolean
  finesStarted?: boolean
  quarantined?: boolean
  nextEqualityReportDueAt?: Date | null
  nextSalaryReportDueAt?: Date | null
  isatCategoryCode?: string | null
}

/**
 * `withReportStatus` selects the derived `reportStatus` alongside the stored
 * columns. It is the read scope for every path that returns a `CompanyDto` —
 * the value is computed in SQL (see `companyReportStatusLiteral`) so it can be
 * filtered/sorted, and so the column matches the list status filter exactly.
 */
@Scopes(() => ({
  withReportStatus: {
    attributes: {
      include: [
        [companyReportStatusLiteral(), 'reportStatus'],
        [equalityReportOverdueLiteral(), 'equalityReportOverdue'],
        [salaryReportOverdueLiteral(), 'salaryReportOverdue'],
      ],
    },
  },
}))
@MutableTable({ tableName: DoeModels.COMPANY })
export class CompanyModel extends MutableModel<
  CompanyAttributes,
  CompanyCreateAttributes
> {
  @Column({ type: DataType.TEXT, allowNull: false })
  name!: string

  @Column({
    type: DataType.ENUM(...Object.values(CompanySizeEnum)),
    allowNull: false,
    field: 'employee_count_category',
  })
  employeeCountCategory!: CompanySizeEnum

  @Column({ type: DataType.TEXT, allowNull: false, field: 'national_id' })
  nationalId!: string

  @Column({
    type: DataType.ENUM(...Object.values(CompanyStatusEnum)),
    allowNull: false,
    defaultValue: CompanyStatusEnum.ACTIVE,
  })
  status!: CompanyStatusEnum

  // Contact email for the company (nullable). Admin-set; the
  // report-deadline-reminder task reads it to address the reminder.
  @Column({ type: DataType.TEXT, allowNull: true })
  email!: string | null

  @Column({ type: DataType.TEXT, allowNull: true })
  address!: string | null

  @ForeignKey(() => PostcodeModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'postcode_id' })
  postcodeId!: string | null

  @BelongsTo(() => PostcodeModel, { foreignKey: 'postcodeId', as: 'postcode' })
  postcode?: PostcodeModel | null

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'salary_report_required',
  })
  salaryReportRequired!: boolean

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'salary_report_required_override',
  })
  salaryReportRequiredOverride!: boolean

  // Daily-fines flag. `true` means the company is in the daily-fines process,
  // which is handled OUTSIDE this system — admins use it to know not to act on
  // the company through the normal flow. Toggled by an admin (both ways); the
  // "when" + reason live on the emitted `company_event` row. See db/README.md.
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'fines_started',
  })
  finesStarted!: boolean

  // Admin-only halt switch. When true, ALL outbound activity for the company
  // (scheduled jobs, emails/notifications, any automated touchpoint) must be
  // skipped. Purely manual — no computed signal sets it. The "when" + reason
  // live on the emitted `company_event` row. See db/README.md.
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'quarantined',
  })
  quarantined!: boolean

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'next_equality_report_due_at',
  })
  nextEqualityReportDueAt!: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'next_salary_report_due_at',
  })
  nextSalaryReportDueAt!: Date | null

  @ForeignKey(() => IsatCategoryModel)
  @Column({ type: DataType.TEXT, allowNull: true, field: 'isat_category_code' })
  isatCategoryCode!: string | null

  @BelongsTo(() => IsatCategoryModel, {
    foreignKey: 'isatCategoryCode',
    targetKey: 'code',
    as: 'isatCategory',
  })
  isatCategory?: IsatCategoryModel | null

  // Derived compliance status — not a stored column. Populated by the
  // `withReportStatus` scope; undefined when the model is loaded outside it, so
  // every CompanyDto read goes through that scope.
  @Column(DataType.VIRTUAL)
  reportStatus!: CompanyReportStatusEnum

  // Derived overdue flags — true when the matching next-due date has passed.
  // Populated by the `withReportStatus` scope alongside `reportStatus`.
  @Column(DataType.VIRTUAL)
  equalityReportOverdue!: boolean

  @Column(DataType.VIRTUAL)
  salaryReportOverdue!: boolean

  static fromModel(model: CompanyModel): CompanyDto {
    return {
      id: model.id,
      name: model.name,
      employeeCountCategory: model.employeeCountCategory,
      nationalId: model.nationalId,
      status: model.status,
      email: model.email,
      address: model.address,
      postcodeId: model.postcodeId,
      salaryReportRequired: model.salaryReportRequired,
      salaryReportRequiredOverride: model.salaryReportRequiredOverride,
      finesStarted: model.finesStarted,
      quarantined: model.quarantined,
      nextEqualityReportDueAt: model.nextEqualityReportDueAt,
      nextSalaryReportDueAt: model.nextSalaryReportDueAt,
      isatCategoryCode: model.isatCategoryCode,
      isatCategory: model.isatCategory
        ? model.isatCategory.fromModel()
        : null,
      reportStatus: model.reportStatus,
      equalityReportOverdue: model.equalityReportOverdue,
      salaryReportOverdue: model.salaryReportOverdue,
    }
  }

  // NOTE: company-level ISAT (isatCategoryCode) is admin-owned statistics data
  // and is intentionally NOT snapshotted here — report_company.isat_category is
  // an independent free-text submission snapshot. See db/README.md.
  static toSnapshot(dto: CompanyDto): CreateReportCompanySnapshotDto {
    return {
      companyId: dto.id,
      parentCompanyId: null,
      name: dto.name,
      nationalId: dto.nationalId,
      address: '',
      city: '',
      postcode: '',
      isatCategory: '',
    }
  }

  fromModel(): CompanyDto {
    return CompanyModel.fromModel(this)
  }
}
