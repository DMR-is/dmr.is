import { ApiOptionalString } from '@dmr.is/decorators'

/**
 * Patch body for an outlier group. `name` patched independently. The four
 * explanation fields are all-or-none: if any is present in the body, all four
 * must be present and non-empty (the resulting group stays CHECK-valid).
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
}
