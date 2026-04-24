import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { ConfigDto, UpdateConfigDto } from './dto/config.dto'
import { IConfigService } from './config.service.interface'

@Controller({
  path: 'config',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class ConfigController {
  constructor(
    @Inject(IConfigService)
    private readonly configService: IConfigService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getAllConfig' })
  @ApiResponse({ status: 200, type: [ConfigDto] })
  async getAll(): Promise<ConfigDto[]> {
    return this.configService.getAll()
  }

  @Get(':key')
  @ApiOperation({ operationId: 'getConfigByKey' })
  @ApiResponse({ status: 200, type: ConfigDto })
  async getByKey(@Param('key') key: string): Promise<ConfigDto> {
    return this.configService.getByKey(key)
  }

  @Get(':key/history')
  @ApiOperation({ operationId: 'getConfigHistoryByKey' })
  @ApiResponse({ status: 200, type: [ConfigDto] })
  async getHistoryByKey(@Param('key') key: string): Promise<ConfigDto[]> {
    return this.configService.getHistoryByKey(key)
  }

  @Patch(':key')
  @ApiOperation({ operationId: 'updateConfigByKey' })
  @ApiResponse({ status: 200, type: ConfigDto })
  async updateByKey(
    @Param('key') key: string,
    @Body() dto: UpdateConfigDto,
  ): Promise<ConfigDto> {
    return this.configService.updateByKey(key, dto)
  }
}
