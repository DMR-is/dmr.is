import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { DoeResponse } from '../../core/decorators/doe-response.decorator'
import { AdminGuard } from '../../core/guards/admin/admin.guard'
import { ConfigDto, UpdateConfigDto } from './dto/config.dto'
import { IConfigService } from './config.service.interface'

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

  @Get(':key')
  @DoeResponse({ operationId: 'getConfigByKey', type: ConfigDto, include404: true })
  async getByKey(@Param('key') key: string): Promise<ConfigDto> {
    return this.configService.getByKey(key)
  }

  @Get(':key/history')
  @DoeResponse({ operationId: 'getConfigHistoryByKey', type: [ConfigDto], include404: true })
  async getHistoryByKey(@Param('key') key: string): Promise<ConfigDto[]> {
    return this.configService.getHistoryByKey(key)
  }

  @Patch(':key')
  @DoeResponse({ operationId: 'updateConfigByKey', type: ConfigDto, include404: true })
  async updateByKey(
    @Param('key') key: string,
    @Body() dto: UpdateConfigDto,
  ): Promise<ConfigDto> {
    return this.configService.updateByKey(key, dto)
  }
}
