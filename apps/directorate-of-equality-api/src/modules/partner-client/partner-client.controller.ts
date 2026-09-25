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

import {
  CreatePartnerClientDto,
  CreatePartnerClientKeyDto,
  GetPartnerClientKeysResponseDto,
  GetPartnerClientsResponseDto,
  IPartnerClientService,
  IssuedPartnerClientKeyDto,
  PartnerClientDto,
  PartnerClientKeyDto,
} from '@dmr.is/doe-modules/partner-client'
import { UserModel } from '@dmr.is/doe-modules/user'
import { ApiKeyOriginEnum } from '@dmr.is/doe-shared'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentAdminUser } from '../../core/decorators/current-admin-user.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'

/**
 * Reviewer-facing administration of vendor clients — the accounting firms
 * approved to file for the companies that delegate to them.
 *
 * Approving a firm is a commercial decision by Jafnréttisstofa, so there is no
 * other way to create one: no public route and no self-service. The firm
 * normally collects its own keys on the self-service web; the key routes here
 * are the fallback, as they are for company keys.
 *
 * Mutations require the ADMIN role and reading does not, following
 * `ApiKeyController`: approving a firm or minting it a credential is an
 * administrative act, seeing that one exists is not, and nothing listed here
 * carries a secret.
 */
@Controller({
  path: 'partner-clients',
  version: '1',
})
@ApiTags('Partner clients')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class PartnerClientController {
  constructor(
    @Inject(IPartnerClientService)
    private readonly partnerClientService: IPartnerClientService,
  ) {}

  @Post()
  @UseGuards(RequireAdminRoleGuard)
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({
    operationId: 'createPartnerClient',
    status: HttpStatus.CREATED,
    type: PartnerClientDto,
    include409: true,
    description:
      'Approves a firm as an intermediary, for every scope — approval is all or nothing. Requires the ADMIN role. `409` if the kennitala is already an active partner client. The firm can file for no one until companies delegate to it.',
  })
  createPartnerClient(
    @CurrentAdminUser() adminUser: UserModel,
    @Body() input: CreatePartnerClientDto,
  ): Promise<PartnerClientDto> {
    return this.partnerClientService.create({
      nationalId: input.nationalId,
      name: input.name,
      actorUserId: adminUser.id,
    })
  }

  @Get()
  @DoeResponse({
    operationId: 'getPartnerClients',
    type: GetPartnerClientsResponseDto,
    description:
      'Every firm ever approved, newest first. Revoked firms are included so the list doubles as an audit view.',
  })
  async getPartnerClients(): Promise<GetPartnerClientsResponseDto> {
    return { partnerClients: await this.partnerClientService.list() }
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @DoeResponse({
    operationId: 'getPartnerClient',
    type: PartnerClientDto,
    include404: true,
  })
  getPartnerClient(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PartnerClientDto> {
    return this.partnerClientService.get(id)
  }

  @Delete(':id')
  @UseGuards(RequireAdminRoleGuard)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @DoeResponse({
    operationId: 'revokePartnerClient',
    type: PartnerClientDto,
    include404: true,
    description:
      'Cuts a firm off. Requires the ADMIN role. It then authenticates nowhere, whatever keys or delegations it still holds; those are left as they are, as their own audit trail. Idempotent.',
  })
  revokePartnerClient(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdminUser() adminUser: UserModel,
  ): Promise<PartnerClientDto> {
    return this.partnerClientService.revoke({ id, actorUserId: adminUser.id })
  }

  @Post(':id/keys')
  @UseGuards(RequireAdminRoleGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @DoeResponse({
    operationId: 'issuePartnerClientKey',
    status: HttpStatus.CREATED,
    type: IssuedPartnerClientKeyDto,
    include404: true,
    include409: true,
    description:
      'Issues a key on a firm’s behalf. Requires the ADMIN role. **The secret is shown exactly once.** The fallback to the firm collecting its own key on the self-service web. `409` if the firm has been revoked.',
  })
  issuePartnerClientKey(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdminUser() adminUser: UserModel,
    @Body() input: CreatePartnerClientKeyDto,
  ): Promise<IssuedPartnerClientKeyDto> {
    return this.partnerClientService.issueKey({
      partnerClientId: id,
      createdVia: ApiKeyOriginEnum.ADMIN,
      actorUserId: adminUser.id,
      label: input.label,
      expiresAt: input.expiresAt,
    })
  }

  @Get(':id/keys')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @DoeResponse({
    operationId: 'getPartnerClientKeys',
    type: GetPartnerClientKeysResponseDto,
    include404: true,
    description:
      'Every key a firm holds, newest first, revoked and expired ones included. Never contains a secret.',
  })
  async getPartnerClientKeys(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetPartnerClientKeysResponseDto> {
    return { keys: await this.partnerClientService.listKeys(id) }
  }

  @Delete(':id/keys/:keyId')
  @UseGuards(RequireAdminRoleGuard)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiParam({
    name: 'keyId',
    type: String,
    format: 'uuid',
    description:
      'The key’s `id` as listed, not the `keyId` inside the credential.',
  })
  @DoeResponse({
    operationId: 'revokePartnerClientKey',
    type: PartnerClientKeyDto,
    include404: true,
    description:
      'Revokes one of a firm’s keys. Requires the ADMIN role. The firm and its other keys are untouched. Idempotent.',
  })
  revokePartnerClientKey(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('keyId', ParseUUIDPipe) keyId: string,
    @CurrentAdminUser() adminUser: UserModel,
  ): Promise<PartnerClientKeyDto> {
    return this.partnerClientService.revokeKey({
      id: keyId,
      partnerClientId: id,
      actorUserId: adminUser.id,
    })
  }
}
