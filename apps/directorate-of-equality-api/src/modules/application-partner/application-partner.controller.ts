import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { resolveActorNationalId } from '@dmr.is/doe-modules/api-key'
import { CompanyDto } from '@dmr.is/doe-modules/company'
import {
  CompanyPartnerDelegationDto,
  GetCompanyPartnerDelegationsResponseDto,
  GetPartnerProvidersResponseDto,
  GrantPartnerDelegationDto,
  IPartnerClientService,
  IPartnerDelegationService,
} from '@dmr.is/doe-modules/partner-client'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'

/**
 * The self-service web's consent routes: a signed-in company sees the approved
 * providers, allows one to act for it, and withdraws that. This is the consent
 * moment, and it happens here — behind island.is login, with the company chosen
 * in IDS — so what is recorded is a witnessed act rather than a firm's claim
 * that its customer agreed.
 *
 * A provider's own keys are in `ApplicationPartnerClientController`, behind a
 * guard that does not need a company row.
 *
 * The company always comes from `CompanyResourceGuard`, never from a request.
 * The person acting is `resolveActorNationalId(user)` — under procuration, the
 * human behind the company login.
 */
@Controller({
  path: 'application',
  version: '1',
})
@ApiTags('Application')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, CompanyResourceGuard)
export class ApplicationPartnerController {
  constructor(
    @Inject(IPartnerClientService)
    private readonly partnerClientService: IPartnerClientService,
    @Inject(IPartnerDelegationService)
    private readonly partnerDelegationService: IPartnerDelegationService,
  ) {}

  // ---------------------------------------------------------------------------
  // Consent: which providers may act for the signed-in company.
  // ---------------------------------------------------------------------------

  @Get('partner-providers')
  @DoeResponse({
    operationId: 'getApplicationPartnerProviders',
    type: GetPartnerProvidersResponseDto,
    description:
      'Every approved provider the signed-in company may allow to act for it, by name. Active providers only, each with its kennitala so two similar names can be told apart. Built from the approved list alone — nothing a provider puts in a link can add to it.',
  })
  async getPartnerProviders(): Promise<GetPartnerProvidersResponseDto> {
    return { providers: await this.partnerClientService.listProviders() }
  }

  @Get('partner-delegations')
  @DoeResponse({
    operationId: 'getApplicationPartnerDelegations',
    type: GetCompanyPartnerDelegationsResponseDto,
    description:
      'The providers the signed-in company currently allows to act for it, newest first, revoked providers left out. Reads the same live delegation rows the partner API enforces — by company id here, by kennitala there, which a composite foreign key keeps pointing at the same company — so what this lists is exactly who can file.',
  })
  async getPartnerDelegations(
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetCompanyPartnerDelegationsResponseDto> {
    return {
      delegations: await this.partnerDelegationService.listLiveForCompany(
        company.id,
      ),
    }
  }

  @Post('partner-delegations')
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({
    operationId: 'grantApplicationPartnerDelegation',
    status: HttpStatus.CREATED,
    type: CompanyPartnerDelegationDto,
    include404: true,
    include409: true,
    description:
      'Allows a provider to act for the signed-in company. Omit `scopes` to hand over everything the provider was approved for, as the self-service web does — a delegation is all or nothing. `404` for a provider that is not on the approved list; `400` for a named scope it was not approved for; `409` if it is already allowed. Recorded on the company’s timeline.',
  })
  grantPartnerDelegation(
    @CurrentCompany() company: CompanyDto,
    @CurrentUser() user: DMRUser,
    @Body() input: GrantPartnerDelegationDto,
  ): Promise<CompanyPartnerDelegationDto> {
    return this.partnerDelegationService.grant({
      company,
      partnerClientId: input.partnerClientId,
      scopes: input.scopes,
      actorNationalId: resolveActorNationalId(user),
    })
  }

  @Delete('partner-delegations/:id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @DoeResponse({
    operationId: 'revokeApplicationPartnerDelegation',
    type: CompanyPartnerDelegationDto,
    include404: true,
    description:
      'Withdraws a provider’s permission to act for the signed-in company. Takes effect on the provider’s next request. Idempotent. Another company’s delegation answers 404.',
  })
  revokePartnerDelegation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCompany() company: CompanyDto,
    @CurrentUser() user: DMRUser,
  ): Promise<CompanyPartnerDelegationDto> {
    return this.partnerDelegationService.revoke({
      id,
      company,
      actorNationalId: resolveActorNationalId(user),
    })
  }
}
