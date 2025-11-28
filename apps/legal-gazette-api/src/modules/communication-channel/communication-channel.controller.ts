import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { ScopesGuard, TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'

import { AdminOnly } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AdminGuard } from '../../core/guards/admin.guard'
import {
  CommunicationChannelDto,
  CreateCommunicationChannelDto,
  GetCommunicationChannelsDto,
  UpdateCommunicationChannelDto,
} from '../../models/communication-channel.model'
import { ICommunicationChannelService } from './communication-channel.service.interface'

@Controller({
  path: ':advertId/communication-channels',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, ScopesGuard, AdminGuard)
@AdminOnly()
export class CommunicationChannelController {
  constructor(
    @Inject(ICommunicationChannelService)
    private readonly communicationChannelService: ICommunicationChannelService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getCommunicationChannels',
    type: GetCommunicationChannelsDto,
  })
  async getChannelsByAdvertId(
    @Param('advertId') advertId: string,
  ): Promise<GetCommunicationChannelsDto> {
    return this.communicationChannelService.getChannelsByAdvertId(advertId)
  }

  @Post()
  @LGResponse({
    operationId: 'createCommunicationChannel',
    type: CommunicationChannelDto,
    status: 201,
  })
  async createChannel(
    @Param('advertId') advertId: string,
    @Body() body: CreateCommunicationChannelDto,
  ): Promise<CommunicationChannelDto> {
    return this.communicationChannelService.createChannel(advertId, body)
  }

  @Patch(':channelId')
  @LGResponse({
    operationId: 'updateCommunicationChannel',
    type: CommunicationChannelDto,
  })
  async updateChannel(
    @Param('advertId') advertId: string,
    @Param('channelId') channelId: string,
    @Body() body: UpdateCommunicationChannelDto,
  ): Promise<CommunicationChannelDto> {
    return this.communicationChannelService.updateChannel(
      advertId,
      channelId,
      body,
    )
  }

  @Delete(':channelId')
  @LGResponse({
    operationId: 'deleteCommunicationChannel',
  })
  async deleteChannel(
    @Param('advertId') advertId: string,
    @Param('channelId') channelId: string,
  ): Promise<void> {
    return this.communicationChannelService.deleteChannel(advertId, channelId)
  }
}
