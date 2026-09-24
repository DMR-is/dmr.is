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
import {
  CreateApiKeyDto,
  GetApiKeysResponseDto,
  IApiKeyService,
  resolveActorNationalId,
} from '@dmr.is/doe-modules/api-key'
import { CompanyDto } from '@dmr.is/doe-modules/company'
import {
  ApiKeyDto,
  ApiKeyOriginEnum,
  IssuedApiKeyDto,
} from '@dmr.is/doe-shared'
import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CurrentCompany } from '../../core/decorators/current-company.decorator'
import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'

/**
 * A signed-in company's own API keys, for filing through the partner API
 * directly rather than through a provider. Called by the self-service web
 * (`directorate-of-equality-partner-web`).
 *
 * These lived on `ApplicationController` because, before the self-service web,
 * the island.is application was the only place a company was signed in with
 * rafræn skilríki. The application flow never issued keys; they sit here, with
 * the self-service web's other routes, so that controller carries only what the
 * application uses. Paths and `operationId`s are unchanged.
 *
 * These endpoints issue a credential for the PARTNER api; nothing here
 * authenticates with one. The company always comes from the authenticated
 * context, so a caller cannot mint or list a credential for anyone else. The
 * admin surface has the same three operations as a fallback, for a company that
 * cannot sign in to the self-service web.
 */
@Controller({
  path: 'application',
  version: '1',
})
@ApiTags('Application')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, CompanyResourceGuard)
export class ApplicationApiKeyController {
  constructor(
    @Inject(IApiKeyService)
    private readonly apiKeyService: IApiKeyService,
  ) {}

  @Post('api-keys')
  @HttpCode(HttpStatus.CREATED)
  @DoeResponse({
    operationId: 'issueApplicationApiKey',
    status: HttpStatus.CREATED,
    type: IssuedApiKeyDto,
    description:
      'Mints an API key for the authenticated company and returns it with the plaintext secret. **The secret is shown exactly once** — it is stored only as a hash and cannot be retrieved again, so a lost key is replaced rather than recovered. Several live keys per company are allowed, which is how a credential is rotated without downtime.',
  })
  async issueApiKey(
    @CurrentCompany() company: CompanyDto,
    @CurrentUser() user: DMRUser,
    @Body() input: CreateApiKeyDto,
  ): Promise<IssuedApiKeyDto> {
    return this.apiKeyService.issue({
      company,
      createdVia: ApiKeyOriginEnum.ISLAND_IS,
      actorNationalId: resolveActorNationalId(user),
      label: input.label,
      scopes: input.scopes,
      expiresAt: input.expiresAt,
    })
  }

  @Get('api-keys')
  @DoeResponse({
    operationId: 'getApplicationApiKeys',
    type: GetApiKeysResponseDto,
    description:
      'Every API key the authenticated company holds, newest first. Revoked and expired keys are included so the list doubles as an audit view. Never contains a secret — none is recoverable.',
  })
  async getApiKeys(
    @CurrentCompany() company: CompanyDto,
  ): Promise<GetApiKeysResponseDto> {
    return { apiKeys: await this.apiKeyService.list(company.id) }
  }

  @Delete('api-keys/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description:
      "The key's `id` as listed, not the `keyId` inside the credential.",
  })
  @DoeResponse({
    operationId: 'revokeApplicationApiKey',
    type: ApiKeyDto,
    include404: true,
    description:
      "Revokes one of the authenticated company's keys. Idempotent — re-revoking leaves the original actor and timestamp intact rather than overwriting the audit trail. A key belonging to another company answers 404, not 403.",
  })
  async revokeApiKey(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentCompany() company: CompanyDto,
    @CurrentUser() user: DMRUser,
  ): Promise<ApiKeyDto> {
    return this.apiKeyService.revoke({
      id,
      company,
      actorNationalId: resolveActorNationalId(user),
    })
  }
}
