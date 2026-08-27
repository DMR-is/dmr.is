import {
  ApiBoolean,
  ApiDateTime,
  ApiEnum,
  ApiOptionalBoolean,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiOptionalUuid,
  ApiUUId,
} from '@dmr.is/decorators'

import { UserDto } from '../../user/dto/user.dto'
import {
  CommunicationStatusEnum,
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from '../models/report.model'

export class ReportDto {
  @ApiUUId()
  id!: string

  @ApiEnum(ReportTypeEnum, { enumName: 'ReportTypeEnum' })
  type!: ReportTypeEnum

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  status!: ReportStatusEnum

  @ApiEnum(CommunicationStatusEnum, { enumName: 'CommunicationStatusEnum' })
  communicationStatus!: CommunicationStatusEnum

  @ApiOptionalString({ nullable: true })
  companyAdminName!: string | null

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company executive.',
  })
  companyAdminTitle!: string | null

  @ApiOptionalString({ nullable: true })
  companyAdminEmail!: string | null

  @ApiOptionalEnum(GenderEnum, { enumName: 'GenderEnum', nullable: true })
  companyAdminGender!: GenderEnum | null

  @ApiOptionalString({ nullable: true })
  contactName!: string | null

  @ApiOptionalString({
    nullable: true,
    description: 'Job title (starfsheiti) of the company contact (tengiliður).',
  })
  contactTitle!: string | null

  @ApiOptionalString({ nullable: true })
  companyNationalId!: string | null

  @ApiOptionalString({ nullable: true })
  contactEmail!: string | null

  @ApiOptionalString({ nullable: true })
  contactPhone!: string | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeMaleCount!: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeFemaleCount!: number | null

  @ApiOptionalNumber({ nullable: true })
  averageEmployeeNeutralCount!: number | null

  @ApiOptionalEnum(SalaryDataBasisEnum, {
    enumName: 'SalaryDataBasisEnum',
    nullable: true,
    description:
      'Salary-only. Whether the submitted salary data describes one specific payroll month (`MONTH`, with the month in `salaryDataPeriod`) or a twelve-month average (`AVERAGE`). Null on equality reports and on salary reports submitted before the field existed.',
  })
  salaryDataBasis!: SalaryDataBasisEnum | null

  @ApiOptionalString({
    nullable: true,
    description:
      'The payroll month the salary data is based on, as an ISO date normalised to the 1st of that month (`YYYY-MM-01`). Set when `salaryDataBasis` is `MONTH`, null for `AVERAGE`.',
  })
  salaryDataPeriod!: string | null

  @ApiOptionalEnum(ReportProviderEnum, {
    enumName: 'ReportProviderEnum',
    nullable: true,
  })
  providerType!: ReportProviderEnum | null

  @ApiOptionalString({ nullable: true })
  providerId!: string | null

  @ApiBoolean()
  importedFromExcel!: boolean

  @ApiOptionalString({ nullable: true })
  identifier!: string | null

  @ApiOptionalBoolean({
    nullable: true,
    description:
      'Salary-only. Null on equality reports. When true, the company has acknowledged every outlier on this salary report but deferred the explanations — all outlier rows are persisted with NULL explanation columns.',
  })
  outliersPostponed!: boolean | null

  @ApiOptionalUuid({ nullable: true })
  equalityReportId!: string | null

  @ApiOptionalUuid({ nullable: true })
  reviewerUserId!: string | null

  @ApiOptionalDateTime({ nullable: true })
  approvedAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  correctionDeadline!: Date | null

  @ApiOptionalString({ nullable: true })
  equalityReportContent!: string | null

  @ApiOptionalDto(UserDto, { nullable: true })
  reviewer?: UserDto | null

  @ApiDateTime()
  createdAt!: Date
}
