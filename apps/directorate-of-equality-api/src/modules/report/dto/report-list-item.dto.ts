import {
  ApiBoolean,
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalEnum,
  ApiOptionalNumber,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import { UserDto } from '../../user/dto/user.dto'
import {
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

  @ApiOptionalString({ nullable: true })
  companyName!: string | null

  @ApiOptionalString({ nullable: true })
  companyNationalId!: string | null

  @ApiOptionalString({ nullable: true })
  companyIsatCategory!: string | null

  @ApiOptionalNumber({ nullable: true })
  companyAverageEmployeeCountFromRsk!: number | null

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
      'True when the most recent activity on this report is a comment authored by the company (application side). Resets to false whenever a reviewer action/event or reviewer comment supersedes it.',
  })
  waitingForAction!: boolean

  @ApiOptionalDateTime({ nullable: true })
  createdAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  correctionDeadline!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null
}
