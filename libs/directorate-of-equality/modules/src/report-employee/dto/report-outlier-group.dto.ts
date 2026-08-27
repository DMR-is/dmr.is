import { ApiOptionalString, ApiString, ApiUUId } from '@dmr.is/decorators'

/**
 * An outlier group owns the improvement-plan explanation shared by every
 * detected outlier assigned to it. A salary report can have multiple groups;
 * each detected outlier belongs to exactly one. Every report with detected
 * outliers has at least one group — when the report is postponed a single
 * default group exists with NULL explanation fields until the applicant
 * resolves it.
 */
export class ReportOutlierGroupDto {
  @ApiUUId()
  id!: string

  @ApiUUId()
  reportId!: string

  @ApiString({
    description:
      'Applicant-supplied label for the group. Non-empty. The implicit single group created when no grouping is provided uses a default name.',
  })
  name!: string

  @ApiOptionalString({
    nullable: true,
    description:
      'Null only while the parent report is postponed (explanation not yet filled). Otherwise non-empty.',
  })
  reason!: string | null

  @ApiOptionalString({ nullable: true })
  action!: string | null

  @ApiOptionalString({ nullable: true })
  signatureName!: string | null

  @ApiOptionalString({ nullable: true })
  signatureRole!: string | null
}
