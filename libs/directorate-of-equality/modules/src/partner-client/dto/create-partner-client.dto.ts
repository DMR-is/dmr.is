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
      'The ceiling on what the firm may ever do. Omit for `report:read`, `salary:submit` and `equality:submit`. `scoring:write` is never granted implicitly: a firm that offers its customers a starfsmat editor needs it named here, and each company still has to grant it in its own delegation.',
  })
  scopes?: ApiKeyScopeEnum[]
}
