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

import { LGResponse } from '../../decorators/lg-response.decorator'
import {
  CommunicationChannelDto,
  CreateCommunicationChannelDto,
  GetCommunicationChannelsDto,
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
