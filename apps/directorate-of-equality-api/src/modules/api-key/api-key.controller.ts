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
  CreateApiKeyDto,
  GetApiKeysResponseDto,
  IApiKeyService,
} from '@dmr.is/doe-modules/api-key'
import { ICompanyService } from '@dmr.is/doe-modules/company'
import { UserModel } from '@dmr.is/doe-modules/user'
import {
  ApiKeyDto,
  ApiKeyOriginEnum,
  IssuedApiKeyDto,
} from '@dmr.is/doe-shared'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentAdminUser } from '../../core/decorators/current-admin-user.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'

/**
 * Reviewer-facing key administration — the fallback to self-service issuance
 * through island.is.
 *
 * It exists because of a limitation in that path rather than as the primary
 * route: the secret is shown exactly once, and the island.is screen is only
 * reachable while an application is open. A company that loses its key and has
 * no open application would otherwise have no way to get another.
 *
 * Nested under `companies/:companyId` rather than sitting at `api-keys/...`
 * because the caller is the company detail page — the same shape as
 * `:id/status`, `:id/timeline` and the other company sub-resources.
 *
 * Mutations require the ADMIN role; reading does not. That split follows
 * `UserController`, where listing is open to any active reviewer and only the
 * writes are pinned. Issuing a credential that can submit on a company's behalf
 * is an administrative act; seeing that one exists is part of reviewing a
 * company, and the list carries no secret to protect.
 */
@Controller({
  path: 'companies',
  version: '1',
})
@ApiTags('API keys')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ApiKeyController {
  constructor(
    @Inject(IApiKeyService)
    private readonly apiKeyService: IApiKeyService,
    @Inject(ICompanyService)
    private readonly companyService: ICompanyService,
  ) {}

  @Post(':companyId/api-keys')
  @UseGuards(RequireAdminRoleGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'companyId', type: String, format: 'uuid' })
  @DoeResponse({
    operationId: 'issueCompanyApiKey',
    status: HttpStatus.CREATED,
    type: IssuedApiKeyDto,
    include404: true,
    description:
      'Issues an API key on a company’s behalf. Requires the ADMIN role. **The secret is shown exactly once** — it is stored only as a hash, cannot be retrieved again, and has to be delivered to the company from this response. Intended as the fallback when a company has lost its key and has no open island.is application to mint a new one from.',
  })
  async issueApiKey(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentAdminUser() adminUser: UserModel,
    @Body() input: CreateApiKeyDto,
  ): Promise<IssuedApiKeyDto> {
    const company = await this.companyService.getById(companyId)

    return this.apiKeyService.issue({
      company,
      createdVia: ApiKeyOriginEnum.ADMIN,
      actorUserId: adminUser.id,
      label: input.label,
      scopes: input.scopes,
      expiresAt: input.expiresAt,
    })
  }

  @Get(':companyId/api-keys')
  @ApiParam({ name: 'companyId', type: String, format: 'uuid' })
  @DoeResponse({
    operationId: 'getCompanyApiKeys',
    type: GetApiKeysResponseDto,
    include404: true,
    description:
      'Every API key a company holds, newest first. Revoked and expired keys are included so the list doubles as an audit view — it shows who minted each key and when it was last used. Never contains a secret; none is recoverable.',
  })
  async getApiKeys(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<GetApiKeysResponseDto> {
    // Resolve first, even though the list query does not need it. Without this
    // an unknown companyId answers 200 with an empty list while POST and DELETE
    // on the same path 404 — three co-located operations disagreeing about what
    // an unknown id means — and the 404 this operation advertises to the
    // generated client could never be produced.
    await this.companyService.getById(companyId)

    return { apiKeys: await this.apiKeyService.list(companyId) }
  }

  @Delete(':companyId/api-keys/:id')
  @UseGuards(RequireAdminRoleGuard)
  @ApiParam({ name: 'companyId', type: String, format: 'uuid' })
  @ApiParam({
    name: 'id',
    type: String,
    description:
      'The key’s `id` as listed, not the `keyId` inside the credential.',
  })
  @DoeResponse({
    operationId: 'revokeCompanyApiKey',
    type: ApiKeyDto,
    include404: true,
    description:
      'Revokes one of the company’s keys. Requires the ADMIN role. Idempotent — re-revoking leaves the original actor and timestamp intact rather than overwriting the audit trail.',
  })
  async revokeApiKey(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdminUser() adminUser: UserModel,
  ): Promise<ApiKeyDto> {
    const company = await this.companyService.getById(companyId)

    return this.apiKeyService.revoke({
      id,
      company,
      actorUserId: adminUser.id,
    })
  }
}
