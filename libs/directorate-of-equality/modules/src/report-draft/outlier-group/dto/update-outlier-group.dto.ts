import { ApiOptionalString } from '@dmr.is/decorators'

/**
 * Patch body for an outlier group. `name` patched independently. The five
 * explanation fields are all-or-none: if any is present in the body, all five
 * must be present (the four texts non-empty) so the resulting group stays
 * CHECK-valid.
 */
export class UpdateOutlierGroupDto {
  @ApiOptionalString({ minLength: 1 })
  name?: string

  @ApiOptionalString()
  reason?: string

  @ApiOptionalString()
  action?: string

  @ApiOptionalString()
  signatureName?: string

  @ApiOptionalString()
  signatureRole?: string

  @ApiOptionalString({
    format: 'date',
    example: '2027-03-01',
    description:
      'Date the company commits to having this group’s improvements completed by ("Dagsetning úrbóta"), as `YYYY-MM-DD`. Must be in the future and no more than three years out.',
  })
  remedyDate?: string
}
