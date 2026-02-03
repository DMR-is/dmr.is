import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared/modules'

import { AdminAccess, LGResponse } from '../../../core/decorators'
import { AuthorizationGuard } from '../../../core/guards'
import {
  CreateTBRCompanySettingsDto,
  GetTBRCompanySettingsQueryDto,
  TBRCompanySettingsItemDto,
  TBRCompanySettingsListDto,
  UpdateTbrCompanySettingsDto,
} from '../../../models/tbr-company-settings.model'
import { ITBRCompanySettingsService } from './tbr-company-settings.service.interface'

@Controller({
  version: '1',
  path: 'settings/tbr-company',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
export class TBRCompanySettingsController {
  constructor(
    @Inject(ITBRCompanySettingsService)
    private readonly tbrCompanySettingsService: ITBRCompanySettingsService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getTBRCompanySettings',
    type: TBRCompanySettingsListDto,
  })
  async getSettings(@Query() query: GetTBRCompanySettingsQueryDto) {
    return this.tbrCompanySettingsService.getSettings(query)
  }

  @Post()
  @LGResponse({
    operationId: 'createTBRCompanySettings',
    type: TBRCompanySettingsItemDto,
  })
  async createSettings(@Body() body: CreateTBRCompanySettingsDto) {
    return this.tbrCompanySettingsService.createSetting(body)
  }

  @Patch(':id')
  @LGResponse({
    operationId: 'updateTBRCompanySettings',
    type: TBRCompanySettingsItemDto,
  })
  async updateSettings(
    @Param('id') id: string,
    @Body() body: UpdateTbrCompanySettingsDto,
  ) {
    return this.tbrCompanySettingsService.updateSetting(id, body)
  }

  @Delete(':id')
  @LGResponse({
    operationId: 'deleteTBRCompanySettings',
    status: 204,
  })
  async deleteSettings(@Param('id') id: string) {
    return this.tbrCompanySettingsService.deleteSetting(id)
  }

  @Post(':id/activate')
  @LGResponse({
    operationId: 'activateTBRCompanySettings',
    status: 200,
  })
  async activateSettings(@Param('id') id: string) {
    return this.tbrCompanySettingsService.markAsActive(id)
  }

  @Post(':id/deactivate')
  @LGResponse({
    operationId: 'deactivateTBRCompanySettings',
    status: 200,
  })
  async deactivateSettings(@Param('id') id: string) {
    return this.tbrCompanySettingsService.markAsInactive(id)
  }
}
