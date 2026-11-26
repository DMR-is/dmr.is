import { CommunicationChannelDto } from '../../models/communication-channel.model'
import {
  CreateCommunicationChannelDto,
  UpdateCommunicationChannelDto,
} from './dto/communication-channel.dto'

export interface ICommunicationChannelService {
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
