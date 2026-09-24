import { ApiArray, ApiString, ApiUUId } from '@dmr.is/decorators'
import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

/**
 * An approved provider as a company sees it when choosing whom to allow. The
 * kennitala is shown beside the name so two similarly named firms are not a
 * coin flip.
 *
 * `scopes` is the firm's approval, so the consent screen can offer only what a
 * grant may name: `grant` refuses anything beyond it, and without the ceiling
 * the company would find that out from a 400 after choosing.
 */
export class PartnerProviderDto {
  @ApiUUId()
  id!: string

  @ApiString()
  name!: string

  @ApiString({ description: 'The firm’s kennitala.' })
  nationalId!: string

  @ApiArray({
    type: String,
    enum: ApiKeyScopeEnum,
    isArray: true,
    description:
      'What Jafnréttisstofa approved the firm to do — the most a company can allow it.',
  })
  scopes!: ApiKeyScopeEnum[]
}
