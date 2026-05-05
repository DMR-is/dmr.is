import { ApiOptionalString, ApiUUId } from '@dmr.is/decorators'

export class ReportEmployeeOutlierDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportEmployeeId!: string

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
