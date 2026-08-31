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

  @ApiOptionalString({
    nullable: true,
    format: 'date',
    example: '2027-03-01',
    description:
      'Date the company commits to having this group’s improvements completed by ("Dagsetning úrbóta"), as `YYYY-MM-DD`.',
  })
  remedyDate!: string | null

  @ApiArray({ type: [String], description: 'Ids of the employees in this group.' })
  memberEmployeeIds!: string[]
}
