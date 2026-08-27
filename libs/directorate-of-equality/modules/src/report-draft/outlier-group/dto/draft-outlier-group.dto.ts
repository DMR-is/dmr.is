import {
  ApiArray,
  ApiOptionalString,
  ApiString,
  ApiUUId,
} from '@dmr.is/decorators'

/** An outlier group on a draft plus the ids of the employees assigned to it. */
export class DraftOutlierGroupDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportId!: string

  @ApiString()
  name!: string

  @ApiOptionalString({ nullable: true })
  reason!: string | null

  @ApiOptionalString({ nullable: true })
  action!: string | null

  @ApiOptionalString({ nullable: true })
  signatureName!: string | null

  @ApiOptionalString({ nullable: true })
  signatureRole!: string | null

  @ApiArray({ type: [String], description: 'Ids of the employees in this group.' })
  memberEmployeeIds!: string[]
}
