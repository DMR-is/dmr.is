import { InjectModel } from '@nestjs/sequelize'

import {
  CommunicationChannelDto,
  CommunicationChannelModel,
  CreateCommunicationChannelDto,
  GetCommunicationChannelsDto,
  UpdateCommunicationChannelDto,
} from '../../models/communication-channel.model'
import { ICommunicationChannelService } from './communication-channel.service.interface'

export class CommunicationChannelService
  implements ICommunicationChannelService
{
  constructor(
    @InjectModel(CommunicationChannelModel)
    private readonly communicationChannelModel: typeof CommunicationChannelModel,
  ) {}

  async getChannelsByAdvertId(
    advertId: string,
  ): Promise<GetCommunicationChannelsDto> {
    const channels = await this.communicationChannelModel.findAll({
      where: { advertId: advertId },
    })

    return {
      channels: channels.map((channel) => channel.fromModel()),
    }
  }
  async createChannel(
    advertId: string,
    body: CreateCommunicationChannelDto,
  ): Promise<CommunicationChannelDto> {
    const channel = await this.communicationChannelModel.create(
      {
        email: body.email,
        phone: body.phone,
        name: body.name,
        advertId: advertId,
      },
      { returning: true },
    )

    return channel.fromModel()
  }
  async deleteChannel(advertId: string, channelId: string): Promise<void> {
    await this.communicationChannelModel.destroy({
      where: { id: channelId, advertId: advertId },
    })
  }
  async updateChannel(
    advertId: string,
    channelId: string,
    body: UpdateCommunicationChannelDto,
  ): Promise<CommunicationChannelDto> {
    const channel = await this.communicationChannelModel.findOneOrThrow({
      where: { id: channelId, advertId: advertId },
    })

    await channel.update({
      email: body.email ?? channel.email,
      name: body.name ?? channel.name,
      phone: body.phone ?? channel.phone,
    })

    return channel.fromModel()
  }
}
