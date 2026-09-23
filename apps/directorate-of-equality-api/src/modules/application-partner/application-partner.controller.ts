import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
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
  CreatePartnerClientKeyDto,
  GetCompanyPartnerDelegationsResponseDto,
  GetPartnerClientKeysResponseDto,
  GetPartnerProvidersResponseDto,
  GrantPartnerDelegationDto,
  IPartnerClientService,
  IPartnerDelegationService,
  IssuedPartnerClientKeyDto,
  PartnerClientDto,
  PartnerClientKeyDto,
} from '@dmr.is/doe-modules/partner-client'
import { ApiKeyOriginEnum } from '@dmr.is/doe-shared'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'

/**
 * The self-service web's side of vendor clients, for two kinds of signed-in
 * company:
 *
 * - **Any company**: see the approved providers, allow one to act for it, and
 *   withdraw that. This is the consent moment, and it happens here — behind
 *   island.is login, with the company chosen in IDS — so what is recorded is a
 *   witnessed act rather than a firm's claim that its customer agreed.
 * - **A company that is itself an approved provider**: collect and rotate its
 *   own vendor keys, signed in as itself, instead of receiving a secret by
 *   email.
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
      'The providers the signed-in company currently allows to act for it, newest first. Answers from the same lookup the partner API enforces, so what this lists is exactly who can file.',
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
      'Allows a provider to act for the signed-in company, with the scopes named. `404` for a provider that is not on the approved list; `400` for a scope it was not approved for; `409` if it is already allowed — to change the scopes, withdraw and grant again. Recorded on the company’s timeline.',
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

  // ---------------------------------------------------------------------------
  // A provider's own credentials, when the signed-in company is one.
  // ---------------------------------------------------------------------------

  @Get('partner-client')
  @DoeResponse({
    operationId: 'getApplicationPartnerClient',
    type: PartnerClientDto,
    include404: true,
    description:
      'The signed-in company’s own provider record, if Jafnréttisstofa has approved it as one. `404` for every other company — which is how the self-service web decides whether to show the provider screens.',
  })
  getPartnerClient(
    @CurrentCompany() company: CompanyDto,
  ): Promise<PartnerClientDto> {
    return this.ownClient(company)
  }

  @Get('partner-client/keys')
  @DoeResponse({
    operationId: 'getApplicationPartnerClientKeys',
    type: GetPartnerClientKeysResponseDto,
    include404: true,
    description:
      'Every vendor key the signed-in provider holds, newest first, revoked and expired ones included. Never contains a secret.',
  })
  async getPartnerClientKeys(
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetPartnerClientKeysResponseDto> {
    const client = await this.ownClient(company)

    return { keys: await this.partnerClientService.listKeys(client.id) }
  }

  @Post('partner-client/keys')
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({
    operationId: 'issueApplicationPartnerClientKey',
    status: HttpStatus.CREATED,
    type: IssuedPartnerClientKeyDto,
    include404: true,
    description:
      'Mints a vendor key (`doev_…`) for the signed-in provider. **The secret is shown exactly once.** Rotate by minting a new one, deploying it, then revoking the old one.',
  })
  async issuePartnerClientKey(
    @CurrentCompany() company: CompanyDto,
    @CurrentUser() user: DMRUser,
    @Body() input: CreatePartnerClientKeyDto,
  ): Promise<IssuedPartnerClientKeyDto> {
    const client = await this.ownClient(company)

    return this.partnerClientService.issueKey({
      partnerClientId: client.id,
      createdVia: ApiKeyOriginEnum.ISLAND_IS,
      actorNationalId: resolveActorNationalId(user),
      label: input.label,
      expiresAt: input.expiresAt,
    })
  }

  @Delete('partner-client/keys/:id')
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description:
      'The key’s `id` as listed, not the `keyId` inside the credential.',
  })
  @DoeResponse({
    operationId: 'revokeApplicationPartnerClientKey',
    type: PartnerClientKeyDto,
    include404: true,
    description:
      'Revokes one of the signed-in provider’s keys. Idempotent. Another provider’s key answers 404.',
  })
  async revokePartnerClientKey(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCompany() company: CompanyDto,
    @CurrentUser() user: DMRUser,
  ): Promise<PartnerClientKeyDto> {
    const client = await this.ownClient(company)

    return this.partnerClientService.revokeKey({
      id,
      partnerClientId: client.id,
      actorNationalId: resolveActorNationalId(user),
    })
  }

  /**
   * The signed-in company's live provider record, or 404. Resolved from the
   * company's own kennitala on every call, so a company can only ever reach
   * its own keys.
   */
  private async ownClient(company: CompanyDto): Promise<PartnerClientDto> {
    const client = await this.partnerClientService.findLiveByNationalId(
      company.nationalId,
    )

    if (!client) {
      throw new NotFoundException('This company is not an approved provider')
    }

    return client
  }
}
