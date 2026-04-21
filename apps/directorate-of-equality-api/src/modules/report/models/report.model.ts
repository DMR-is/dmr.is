import { BelongsTo, Column, DataType, ForeignKey } from 'sequelize-typescript'

import { MutableModel, MutableTable } from '@dmr.is/shared-models-base'

import { DoeModels } from '../../../core/constants'
import { UserModel } from '../../user/models/user.model'
import type { ReportDto } from '../dto/report.dto'

export enum ReportTypeEnum {
  SALARY = 'SALARY',
  EQUALITY = 'EQUALITY',
}

export enum ReportStatusEnum {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  DENIED = 'DENIED',
  APPROVED = 'APPROVED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NEUTRAL = 'NEUTRAL',
}

export enum ReportProviderEnum {
  SYSTEM = 'SYSTEM',
  ISLAND_IS = 'ISLAND_IS',
  OTHER = 'OTHER',
}

type ReportAttributes = {
  type: ReportTypeEnum
  status: ReportStatusEnum

  companyAdminName: string | null
  companyAdminEmail: string | null
  companyAdminGender: GenderEnum | null

  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null

  averageEmployeeMaleCount: number | null
  averageEmployeeFemaleCount: number | null
  averageEmployeeNeutralCount: number | null

  providerType: ReportProviderEnum | null
  providerId: string | null
  importedFromExcel: boolean
  identifier: string | null

  equalityReportId: string | null
  reviewerUserId: string | null

  denialReason: string | null
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
  contactEmail?: string | null
  contactPhone?: string | null

  averageEmployeeMaleCount?: number | null
  averageEmployeeFemaleCount?: number | null
  averageEmployeeNeutralCount?: number | null

  providerType?: ReportProviderEnum | null
  providerId?: string | null
  importedFromExcel?: boolean
  identifier?: string | null

  equalityReportId?: string | null
  reviewerUserId?: string | null

  denialReason?: string | null
  approvedAt?: Date | null
  validUntil?: Date | null
  correctionDeadline?: Date | null
  equalityReportContent?: string | null
  finesStartedAt?: Date | null
}

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

  @ForeignKey(() => ReportModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'equality_report_id' })
  equalityReportId!: string | null

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.UUID, allowNull: true, field: 'reviewer_user_id' })
  reviewerUserId!: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'denial_reason' })
  denialReason!: string | null

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

  static fromModel(model: ReportModel): ReportDto {
    return {
      id: model.id,
      type: model.type,
      status: model.status,
      companyAdminName: model.companyAdminName,
      companyAdminEmail: model.companyAdminEmail,
      companyAdminGender: model.companyAdminGender,
      contactName: model.contactName,
      contactEmail: model.contactEmail,
      contactPhone: model.contactPhone,
      averageEmployeeMaleCount: model.averageEmployeeMaleCount,
      averageEmployeeFemaleCount: model.averageEmployeeFemaleCount,
      averageEmployeeNeutralCount: model.averageEmployeeNeutralCount,
      providerType: model.providerType,
      providerId: model.providerId,
      importedFromExcel: model.importedFromExcel,
      identifier: model.identifier,
      equalityReportId: model.equalityReportId,
      reviewerUserId: model.reviewerUserId,
      denialReason: model.denialReason,
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

  fromModel(): ReportDto {
    return ReportModel.fromModel(this)
  }
}
