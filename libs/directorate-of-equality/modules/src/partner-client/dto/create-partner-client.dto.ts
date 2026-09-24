import { ApiNationalId, ApiOptionalArray, ApiString } from '@dmr.is/decorators'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

/** Approving a firm as an intermediary. */
export class CreatePartnerClientDto {
  @ApiNationalId({ description: 'The firm’s kennitala.' })
  nationalId!: string

  @ApiString({ minLength: 1, maxLength: 256 })
  name!: string

  @ApiOptionalArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
    description:
      'The ceiling on what the firm may ever do. Omit for every scope, `scoring:write` included — approval is all or nothing, and the admin screen sends nothing. What the firm may do for a given company is this intersected with that company’s delegation.',
  })
  scopes?: ApiKeyScopeEnum[]
}
