import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import {
  ConfigDto,
  IConfigService,
  OneSystemsStatusDto,
  UpdateConfigDto,
} from '@dmr.is/doe-modules/config'
import { isMailboxDeliveryEnabled } from '@dmr.is/doe-modules/mailbox-delivery'
import { type UserModel } from '@dmr.is/doe-modules/user'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { RequireAdminRoleGuard } from '../../core/guards/admin-role/require-admin-role.guard'

@Controller({
  path: 'config',
  version: '1',
})
@ApiTags('Config')
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AdminGuard)
export class ConfigController {
  constructor(
    @Inject(IConfigService)
    private readonly configService: IConfigService,
  ) {}

  @Get()
  @DoeResponse({ operationId: 'getAllConfig', type: [ConfigDto] })
  async getAll(): Promise<ConfigDto[]> {
    return this.configService.getAll()
  }

  /**
   * The environment's mailbox switch, for the Kerfisstillingar page. Two
   * segments, so it never matches `:key`. Read through the same function the
   * mailbox delivery uses, so the page cannot disagree with what is sent.
   */
  @Get('environment/onesystems')
  @DoeResponse({
    operationId: 'getOneSystemsStatus',
    type: OneSystemsStatusDto,
  })
  getOneSystemsStatus(): OneSystemsStatusDto {
    return { enabled: isMailboxDeliveryEnabled() }
  }

  @Get(':key')
  @DoeResponse({
    operationId: 'getConfigByKey',
    type: ConfigDto,
    include404: true,
  })
  async getByKey(@Param('key') key: string): Promise<ConfigDto> {
    return this.configService.getByKey(key)
  }

  @Get(':key/history')
  @DoeResponse({
    operationId: 'getConfigHistoryByKey',
    type: [ConfigDto],
    include404: true,
  })
  async getHistoryByKey(@Param('key') key: string): Promise<ConfigDto[]> {
    return this.configService.getHistoryByKey(key)
  }

  /**
   * Writing config is ADMIN-only. The class-level `AdminGuard` proves no more
   * than "active DoE reviewer", and lowering the salary threshold is
   * irreversible, so the route carries its own role guard — matching
   * `UserController`. Reads stay open to any reviewer.
   */
  @Patch(':key')
  @UseGuards(RequireAdminRoleGuard)
  @DoeResponse({
    operationId: 'updateConfigByKey',
    type: ConfigDto,
    include404: true,
    // A stale `expectedValue`: someone changed the value since it was read.
    include409: true,
  })
  async updateByKey(
    @Param('key') key: string,
    @Body() dto: UpdateConfigDto,
    @Req() req: { adminUser: UserModel },
  ): Promise<ConfigDto> {
    return this.configService.updateByKey(key, dto, req.adminUser.id)
  }
}
