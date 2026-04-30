import { ApiBoolean, ApiOptionalString, ApiUUId } from '@dmr.is/decorators'

export class ReportEmployeeOutlierDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportEmployeeId!: string

  @ApiBoolean({
    description:
      'When true, the company has acknowledged the outlier but deferred the explanation. Reason/action/signatures may be null.',
  })
  postponed!: boolean

  @ApiOptionalString({ nullable: true })
  reason!: string | null

  @ApiOptionalString({ nullable: true })
  action!: string | null

  @ApiOptionalString({ nullable: true })
  signatureName!: string | null

  @ApiOptionalString({ nullable: true })
  signatureRole!: string | null
}
