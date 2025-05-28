import { CommunicationChannelModel } from '../communication-channel.model'
import { CommunicationChannelDto } from './communication-channel.dto'

export const communicationChannelMigrate = (
  model: CommunicationChannelModel,
): CommunicationChannelDto => ({
  email: model.email,
  name: model?.name ?? undefined,
  phone: model?.phone ?? undefined,
})
