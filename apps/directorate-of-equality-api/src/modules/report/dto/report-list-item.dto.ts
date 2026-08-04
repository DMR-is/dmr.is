import {
  ApiBoolean,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalEnum,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import { CompanySizeEnum } from '../../company/models/company.enums'
import { UserDto } from '../../user/dto/user.dto'
import {
  CommunicationStatusEnum,
  GenderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../models/report.model'

/**
 * Compact row for the admin list view. Keeps the payload small enough for
 * long lists + matches the columns the admin UI actually renders. Heavier
 * fields (criteria tree, employees, comments, results) are only fetched
 * when the admin opens the detail view.
 */
export class ReportListItemDto {
  @ApiUUId()
  id!: string

  @ApiOptionalString({ nullable: true })
  identifier!: string | null

  @ApiEnum(ReportTypeEnum, { enumName: 'ReportTypeEnum' })
  type!: ReportTypeEnum

  @ApiEnum(ReportStatusEnum, { enumName: 'ReportStatusEnum' })
  status!: ReportStatusEnum

  @ApiEnum(CommunicationStatusEnum, { enumName: 'CommunicationStatusEnum' })
  communicationStatus!: CommunicationStatusEnum

  @ApiOptionalString({ nullable: true })
  companyName!: string | null

  @ApiOptionalString({ nullable: true })
  companyNationalId!: string | null

  @ApiOptionalString({ nullable: true })
  companyIsatCategory!: string | null

  @ApiOptionalEnum(CompanySizeEnum, {
    enumName: 'CompanySizeEnum',
    nullable: true,
  })
  companyEmployeeCountCategory!: CompanySizeEnum | null

  @ApiOptionalString({ nullable: true })
  companyAdminName!: string | null

  @ApiOptionalString({ nullable: true })
  companyAdminEmail!: string | null

  @ApiOptionalEnum(GenderEnum, { enumName: 'GenderEnum', nullable: true })
  companyAdminGender!: GenderEnum | null

  @ApiOptionalDto(UserDto, { nullable: true })
  reviewer?: UserDto | null

  @ApiBoolean({
    description:
      'Daily-fines flag. `true` means the company is currently in the daily-fines process.',
  })
  companyFinesStarted!: boolean

  @ApiBoolean({
    description:
      'Quarantine flag. `true` means the company is currently quarantined.',
  })
  companyQuarantined!: boolean

  @ApiBoolean({
    description:
      'True when the report has at least one employee outlier — outliers are the input that drives the company-side improvement plan.',
  })
  includesImprovementPlan!: boolean

  @ApiOptionalDateTime({ nullable: true })
  createdAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  correctionDeadline!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null
}
