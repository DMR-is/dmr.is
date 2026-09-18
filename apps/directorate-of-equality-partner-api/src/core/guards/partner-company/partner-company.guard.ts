import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { CompanyDto, ICompanyService } from '@dmr.is/doe-modules/company'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ApiKeyRequest } from '../api-key/api-key.guard'

export type PartnerCompanyRequest = ApiKeyRequest & {
  companyContext?: CompanyDto
}

/**
 * Resolves the company a verified key belongs to.
 *
 * The counterpart to `CompanyResourceGuard` on the island.is surface, and the
 * same shape of decision: authorization is by resolution — whoever the key names
 * is the tenant, and every service below takes a `CompanyDto`.
 *
 * One deliberate difference: it does NOT auto-provision. `CompanyResourceGuard`
 * has `@AutoProvisionCompany` because a company arriving through island.is may
 * legitimately be new to us — it authenticated with a kennitala and the national
 * registry can be asked about it. A key, by contrast, can only exist if
 * `doe_api_key.company_id` already pointed at a row, so a missing company here
 * is a broken foreign key, not a new customer.
 */
@Injectable()
export class PartnerCompanyGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<PartnerCompanyRequest>()

    if (!request.apiKeyContext) {
      // Logged, not returned — see the note on RequireApiScopeGuard.
      this.logger.error(
        'PartnerCompanyGuard ran without ApiKeyGuard — fix the @UseGuards order',
        { context: 'PartnerCompanyGuard' },
      )
      throw new InternalServerErrorException()
    }

    request.companyContext = await this.companyService.getByNationalId(
      request.apiKeyContext.companyNationalId,
    )

    return true
  }
}
