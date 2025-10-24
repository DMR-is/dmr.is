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

import { TokenJwtAuthGuard } from '@dmr.is/modules'

import {
  CreateCommunicationChannelDto,
  UpdateCommunicationChannelDto,
} from './dto/communication-channel.dto'
import { ICommunicationChannelService } from './communication-channel.service.interface'

@Controller({
  path: ':advertId/communication-channels',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class CommunicationChannelController {
  constructor(
    @Inject(ICommunicationChannelService)
    private readonly communicationChannelService: ICommunicationChannelService,
  ) {}

  @Get()
  async getChannelsByAdvertId(@Param('advertId') advertId: string) {
    return this.communicationChannelService.getChannelsByAdvertId(advertId)
  }

  @Post()
  async createChannel(
    @Param('advertId') advertId: string,
    @Body() body: CreateCommunicationChannelDto,
  ) {
    return this.communicationChannelService.createChannel(advertId, body)
  }

  @Patch(':channelId')
  async updateChannel(
    @Param('advertId') advertId: string,
    @Param('channelId') channelId: string,
    @Body() body: UpdateCommunicationChannelDto,
  ) {
    return this.communicationChannelService.updateChannel(
      advertId,
      channelId,
      body,
    )
  }

  @Delete(':channelId')
  async deleteChannel(
    @Param('advertId') advertId: string,
    @Param('channelId') channelId: string,
  ) {
    return this.communicationChannelService.deleteChannel(advertId, channelId)
  }
}
