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
import {
  CreatePartnerClientKeyDto,
  GetPartnerClientKeysResponseDto,
  IPartnerClientService,
  IssuedPartnerClientKeyDto,
  PartnerClientDto,
  PartnerClientKeyDto,
} from '@dmr.is/doe-modules/partner-client'
import { ApiKeyOriginEnum } from '@dmr.is/doe-shared'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentPartnerClient } from '../../core/decorators/current-partner-client.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { PartnerClientResourceGuard } from '../../core/guards/partner-client-resource/partner-client-resource.guard'

/**
 * An approved provider collecting and rotating its own vendor keys, signed in
 * to the self-service web as itself, instead of receiving a secret by email.
 *
 * Its own controller so that `CompanyResourceGuard` does not apply: handler
 * guards are unioned with class guards, so these routes could not shed it
 * beside the consent routes. A firm need not be an employer in the register,
 * and `PartnerClientResourceGuard` resolves it from the token's kennitala
 * without a company row. The firm is always the one signed in — never a
 * request field.
 */
@Controller({
  path: 'application',
  version: '1',
})
@ApiTags('Application')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, PartnerClientResourceGuard)
export class ApplicationPartnerClientController {
  constructor(
    @Inject(IPartnerClientService)
    private readonly partnerClientService: IPartnerClientService,
  ) {}

  @Get('partner-client')
  @DoeResponse({
    operationId: 'getApplicationPartnerClient',
    type: PartnerClientDto,
    include404: true,
    description:
      'The signed-in organisation’s own provider record, if Jafnréttisstofa has approved it as one. `404` for anyone else — which is how the self-service web decides whether to show the provider screens. Needs no entry in the employer register.',
  })
  getPartnerClient(
    @CurrentPartnerClient() client: PartnerClientDto,
  ): PartnerClientDto {
    return client
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
    @CurrentPartnerClient() client: PartnerClientDto,
  ): Promise<GetPartnerClientKeysResponseDto> {
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
  issuePartnerClientKey(
    @CurrentPartnerClient() client: PartnerClientDto,
    @CurrentUser() user: DMRUser,
    @Body() input: CreatePartnerClientKeyDto,
  ): Promise<IssuedPartnerClientKeyDto> {
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
  revokePartnerClientKey(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentPartnerClient() client: PartnerClientDto,
    @CurrentUser() user: DMRUser,
  ): Promise<PartnerClientKeyDto> {
    return this.partnerClientService.revokeKey({
      id,
      partnerClientId: client.id,
      actorNationalId: resolveActorNationalId(user),
    })
  }
}
