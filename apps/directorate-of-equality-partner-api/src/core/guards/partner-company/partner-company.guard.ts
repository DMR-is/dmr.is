import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { CompanyDto, ICompanyService } from '@dmr.is/doe-modules/company'
import { IPartnerDelegationService } from '@dmr.is/doe-modules/partner-client'
import { ApiKeyKindEnum } from '@dmr.is/doe-shared'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ApiKeyRequest } from '../api-key/api-key.guard'

/**
 * Names the company a vendor client key is acting for, on every request.
 * Lower-case because Node lower-cases incoming header names.
 */
export const COMPANY_NATIONAL_ID_HEADER = 'x-company-national-id'

export type PartnerCompanyRequest = ApiKeyRequest & {
  companyContext?: CompanyDto
  /**
   * The firm acting for `companyContext`, when the key is a vendor client's.
   * Recorded on the report as its provenance.
   */
  partnerClientId?: string
}

/**
 * Resolves the company a request acts for — the tenant — and nothing else.
 *
 * The counterpart to `CompanyResourceGuard` on the island.is surface, and the
 * same shape of decision: authorization is by resolution. Every service below
 * takes a `CompanyDto` and cannot tell which kind of key resolved it.
 *
 * - **A company key** names its tenant itself (`doe_api_key.company_national_id`).
 *   It must not also send `X-Company-National-Id`: that header has no meaning
 *   on a company key, and accepting it silently would teach integrators it does.
 * - **A vendor client key** names a firm, not a tenant. The company comes from
 *   `X-Company-National-Id`, and only while a live delegation from that company
 *   to the firm exists. The key's scopes are then narrowed to the intersection
 *   with the delegation's, on the context `RequireApiScopeGuard` reads next —
 *   which is why this guard runs before it.
 *
 * Neither path auto-provisions. A company key can only exist if its company row
 * does, and a delegation references its company by foreign key, so a missing
 * company here is a broken reference, not a new customer.
 */
@Injectable()
export class PartnerCompanyGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICompanyService) private readonly companyService: ICompanyService,
    @Inject(IPartnerDelegationService)
    private readonly partnerDelegationService: IPartnerDelegationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PartnerCompanyRequest>()
    const apiKey = request.apiKeyContext

    if (!apiKey) {
      // Logged, not returned — see the note on RequireApiScopeGuard.
      this.logger.error(
        'PartnerCompanyGuard ran without ApiKeyGuard — fix the @UseGuards order',
        { context: 'PartnerCompanyGuard' },
      )
      throw new InternalServerErrorException()
    }

    const header = request.headers[COMPANY_NATIONAL_ID_HEADER]

    if (apiKey.kind === ApiKeyKindEnum.COMPANY) {
      if (header !== undefined) {
        throw new BadRequestException(
          'X-Company-National-Id is only sent with a vendor client key. A company key already names its company; remove the header.',
        )
      }

      request.companyContext = await this.companyService.getByNationalId(
        apiKey.companyNationalId,
      )

      return true
    }

    // A 400 naming the header, not a 401: the credential was fine, and a 401
    // would send an integrator hunting in the wrong place.
    const nationalId = this.parseHeader(header)

    const delegation = await this.partnerDelegationService.findLive(
      apiKey.partnerClientId,
      nationalId,
    )

    if (!delegation) {
      throw new ForbiddenException(
        'This company has not allowed your organisation to act for it, or has withdrawn that permission. It can grant it on the Jafnréttisstofa self-service web.',
      )
    }

    request.companyContext = await this.companyService.getByNationalId(
      delegation.companyNationalId,
    )
    request.partnerClientId = apiKey.partnerClientId
    request.apiKeyContext = {
      ...apiKey,
      scopes: apiKey.scopes.filter((scope) =>
        delegation.scopes.includes(scope),
      ),
    }

    return true
  }

  private parseHeader(header: string | string[] | undefined): string {
    if (header === undefined) {
      throw new BadRequestException(
        'A vendor client key must name the company it acts for in the X-Company-National-Id header.',
      )
    }

    // A repeated header arrives as an array. Two companies in one request is
    // not a question this guard should answer by picking one.
    const value = typeof header === 'string' ? header.replace(/[- ]/g, '') : ''

    if (!/^\d{10}$/.test(value)) {
      throw new BadRequestException(
        'X-Company-National-Id must be one kennitala of 10 digits (XXXXXXXXXX or XXXXXX-XXXX).',
      )
    }

    return value
  }
}
