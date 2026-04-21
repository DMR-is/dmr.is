import { ApiString, ApiUUId } from '@dmr.is/decorators'

export class ReportEmployeeDeviationDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportEmployeeId!: string

  @ApiString()
  reason!: string

  @ApiString()
  action!: string

  @ApiString()
  signatureName!: string

  @ApiString()
  signatureRole!: string
}
