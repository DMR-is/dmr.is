import {
  ApiBoolean,
  ApiEnum,
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
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../models/report.model'

export class ReportDto {
  @ApiUUId()
  id!: string

  @ApiEnum(ReportTypeEnum, { enumName: 'ReportTypeEnum' })
  type!: ReportTypeEnum

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  status!: ReportStatusEnum

  @ApiOptionalString({ nullable: true })
  companyAdminName!: string | null

  @ApiOptionalString({ nullable: true })
  companyAdminEmail!: string | null

  @ApiOptionalEnum(GenderEnum, { enumName: 'GenderEnum', nullable: true })
  companyAdminGender!: GenderEnum | null

  @ApiOptionalString({ nullable: true })
  contactName!: string | null

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

  @ApiOptionalDateTime({ nullable: true })
  finesStartedAt!: Date | null

  @ApiOptionalDto(UserDto, { nullable: true })
  reviewer?: UserDto | null
}
