import { ApiBoolean } from '@dmr.is/decorators'

import { CompanyDto } from '../../company/dto/company.dto'

/**
 * The signed-in organisation as the applicant routes see it: its register row
 * plus what only the applicant side needs.
 *
 * A separate DTO, not a field on `CompanyDto`, because the admin routes return
 * `CompanyDto` too and have no use for a per-viewer flag.
 */
export class ApplicationCompanyDto extends CompanyDto {
  @ApiBoolean({
    description:
      'True when this organisation is also an approved service provider (þjónustuaðili) — a live partner client, not revoked. Decided by the same lookup that guards `GET /application/partner-client` and the provider key routes, so `true` here means those routes answer and `false` means they 404.',
  })
  isServiceProvider!: boolean
}
