import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  UseGuards,
} from '@nestjs/common'
import { ApiSecurity, ApiTags } from '@nestjs/swagger'

import {
  GetPartnerDelegationsResponseDto,
  IPartnerDelegationService,
} from '@dmr.is/doe-modules/partner-client'
import { ApiKeyKindEnum, ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { CurrentApiKey } from '../../core/decorators/current-api-key.decorator'
import { PartnerResponse } from '../../core/decorators/partner-response.decorator'
import { ApiKeyGuard } from '../../core/guards/api-key/api-key.guard'
import { RequireApiScope } from '../../core/guards/api-key-scope/require-api-scope.decorator'
import { RequireApiScopeGuard } from '../../core/guards/api-key-scope/require-api-scope.guard'
import { ApiKeyThrottlerGuard } from '../../core/guards/api-key-throttler/api-key-throttler.guard'
import { PartnerClientGuard } from '../../core/guards/partner-client/partner-client.guard'
import { ApiKeyContext } from '../api-key/api-key.types'

/**
 * What a vendor client needs to know about itself: which companies have
 * allowed it to act for them.
 *
 * Polling this is how a firm's product shows "connected" per customer, notices
 * a withdrawal, and learns that a customer finished granting permission on the
 * self-service web — no redirect callback needed, and it survives the customer
 * closing the tab.
 *
 * `PartnerClientGuard` stands in for `PartnerCompanyGuard`: the route is about
 * the firm, so there is no company to resolve and no register check to make.
 */
@Controller({
  path: 'partner',
  version: '1',
})
@ApiTags('Partner')
@ApiSecurity('apiKey')
@UseGuards(
  ApiKeyGuard,
  PartnerClientGuard,
  RequireApiScopeGuard,
  ApiKeyThrottlerGuard,
)
export class DelegationController {
  constructor(
    @Inject(IPartnerDelegationService)
    private readonly partnerDelegationService: IPartnerDelegationService,
  ) {}

  @Get('delegations')
  @RequireApiScope(ApiKeyScopeEnum.REPORT_READ)
  @PartnerResponse({
    operationId: 'getPartnerDelegations',
    type: GetPartnerDelegationsResponseDto,
    description:
      'Vendor client keys only. The companies that currently allow your organisation to act for them, newest first, each with the scopes it granted. Send a company’s `companyNationalId` as `X-Company-National-Id` to act for it. A company that withdraws disappears from this list. A company key gets `403`.',
  })
  async getDelegations(
    @CurrentApiKey() apiKey: ApiKeyContext,
  ): Promise<GetPartnerDelegationsResponseDto> {
    // PartnerClientGuard has already refused every other kind; this narrows the
    // type for the compiler, which cannot see a guard. Refusing rather than
    // answering an empty list, so that removing the guard fails loudly instead
    // of telling a company key "nobody has granted you anything".
    if (apiKey.kind !== ApiKeyKindEnum.PARTNER_CLIENT) {
      throw new ForbiddenException()
    }

    return {
      delegations: await this.partnerDelegationService.listLiveForClient(
        apiKey.partnerClientId,
      ),
    }
  }
}
