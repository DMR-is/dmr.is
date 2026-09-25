import { ApiNationalId, ApiString } from '@dmr.is/decorators'

/**
 * Approving a firm as an intermediary.
 *
 * No `scopes`: approval is all or nothing, so every firm is approved for every
 * scope. That is what lets the consent screen promise a company exactly what a
 * delegation hands over — a delegation copies the firm's approval.
 */
export class CreatePartnerClientDto {
  @ApiNationalId({ description: 'The firm’s kennitala.' })
  nationalId!: string

  @ApiString({ minLength: 1, maxLength: 256 })
  name!: string
}
