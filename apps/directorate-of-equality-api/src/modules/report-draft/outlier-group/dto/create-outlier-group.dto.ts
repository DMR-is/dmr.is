import { ApiOptionalString, ApiString } from '@dmr.is/decorators'

/**
 * Body for creating an outlier group on a draft. The four explanation fields
 * are all-or-none (DB CHECK): provide all four (non-empty) for an explained
 * group, or omit them all for a not-yet-explained group. `name` is required.
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
}
