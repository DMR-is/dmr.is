import { ApiString } from '@dmr.is/decorators'

/**
 * The reporting company, frozen onto the report as a snapshot rather than
 * looked up at read time — the register is synced from Skatturinn once a year,
 * so a filing is the fresher account of an employer's own details and is meant
 * to keep the figures a report was approved on intact afterwards.
 *
 * **No `nationalId`.** It carried none: the submission rejected any value that
 * was not the authenticated company's, so the only accepted value was the one
 * the server already had, and a caller could do nothing with the field but get
 * it wrong. The snapshot's kennitala now comes from the authenticated company
 * directly, which also makes the two structurally incapable of disagreeing.
 */
export class SubmitReportCompanyDto {
  @ApiString()
  name!: string

  @ApiString()
  address!: string

  @ApiString()
  city!: string

  @ApiString()
  postcode!: string

  @ApiString()
  isatCategory!: string
}

export class SubmitReportSubsidiaryDto {
  @ApiString()
  name!: string

  @ApiString()
  nationalId!: string
}
