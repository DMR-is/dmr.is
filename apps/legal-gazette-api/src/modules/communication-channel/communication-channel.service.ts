import { InjectModel } from '@nestjs/sequelize'

import { assertAdvertEditable } from '../../core/utils/advert-status.util'
import { AdvertModel } from '../../models/advert.model'
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
    @InjectModel(AdvertModel)
    private readonly advertModel: typeof AdvertModel,
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
    // Check advert status before creating channel
    const advert = await this.advertModel.findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    assertAdvertEditable(advert, 'communication channel')

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
    // Check advert status before deleting channel
    const advert = await this.advertModel.findByPkOrThrow(advertId, {
      attributes: ['id', 'statusId'],
    })

    assertAdvertEditable(advert, 'communication channel')

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
      include: [
        {
          model: AdvertModel,
          attributes: ['id', 'statusId'],
        },
      ],
    })

    // Prevent modification if advert is in a terminal state
    assertAdvertEditable(channel.advert, 'communication channel')

    await channel.update({
      email: body.email ?? channel.email,
      name: body.name ?? channel.name,
      phone: body.phone ?? channel.phone,
    })

    return channel.fromModel()
  }
}
