import { ApiOptionalString, ApiString } from '@dmr.is/decorators'

/**
 * Body for creating an outlier group on a draft. The five explanation fields
 * are all-or-none (DB CHECK): provide all five (the four texts non-empty) for
 * an explained group, or omit them all for a not-yet-explained group. `name` is
 * required.
 */
export class CreateOutlierGroupDto {
  @ApiString({ minLength: 1 })
  name!: string

  @ApiOptionalString({ nullable: true })
  reason?: string | null

  @ApiOptionalString({ nullable: true })
  action?: string | null

  @ApiOptionalString({ nullable: true })
  signatureName?: string | null

  @ApiOptionalString({ nullable: true })
  signatureRole?: string | null

  @ApiOptionalString({
    nullable: true,
    format: 'date',
    example: '2027-03-01',
    description:
      'Date the company commits to having this group’s improvements completed by ("Dagsetning úrbóta"), as `YYYY-MM-DD`. Must be in the future and no more than three years out — the next reporting cycle, beyond which the date belongs to a period this report cannot speak for.',
  })
  remedyDate?: string | null
}
