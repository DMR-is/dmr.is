import {
  CommunicationChannelDto,
  CreateCommunicationChannelDto,
  GetCommunicationChannelsDto,
  UpdateCommunicationChannelDto,
} from '../../models/communication-channel.model'

export interface ICommunicationChannelService {
  getChannelsByAdvertId(advertId: string): Promise<GetCommunicationChannelsDto>

  createChannel(
    advertId: string,
    body: CreateCommunicationChannelDto,
  ): Promise<CommunicationChannelDto>

  deleteChannel(advertId: string, channelId: string): void

  updateChannel(
    advertId: string,
    channelId: string,
    body: UpdateCommunicationChannelDto,
  ): Promise<CommunicationChannelDto>
}

export const ICommunicationChannelService = Symbol(
  'ICommunicationChannelService',
)
