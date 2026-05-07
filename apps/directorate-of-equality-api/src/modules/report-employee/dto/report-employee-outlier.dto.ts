import {
  ApiOptionalEnum,
  ApiOptionalString,
  ApiUUId,
} from '@dmr.is/decorators'

import { GenderEnum } from '../../report/models/report.model'

export class ReportEmployeeOutlierDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportEmployeeId!: string

  @ApiOptionalEnum(GenderEnum, { enumName: 'GenderEnum', nullable: true })
  gender!: GenderEnum | null

  @ApiOptionalString({ nullable: true })
  roleTitle!: string | null

  @ApiOptionalString({
    nullable: true,
    description:
      'Null only when the parent report has `outliersPostponed = true`. Otherwise required and non-empty.',
  })
  reason!: string | null

  @ApiOptionalString({ nullable: true })
  action!: string | null

  @ApiOptionalString({ nullable: true })
  signatureName!: string | null

  @ApiOptionalString({ nullable: true })
  signatureRole!: string | null
}
