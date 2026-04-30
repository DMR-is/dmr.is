import {
  ApiEnum,
  ApiOptionalDateTime,
  ApiOptionalDto,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import { UserDto } from '../../user/dto/user.dto'
import { ReportStatusEnum, ReportTypeEnum } from '../models/report.model'

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

  @ApiOptionalDto(UserDto, { nullable: true })
  reviewer?: UserDto | null

  @ApiOptionalDateTime({ nullable: true })
  createdAt!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  correctionDeadline!: Date | null

  @ApiOptionalDateTime({ nullable: true })
  validUntil!: Date | null
}
