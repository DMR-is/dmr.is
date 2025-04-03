import { CaseChannel } from '@dmr.is/official-journal/dto/case-channel/case-channel.dto'
import { CaseChannelModel } from '@dmr.is/official-journal/models'

export const caseChannelMigrate = (model: CaseChannelModel): CaseChannel => ({
  id: model.id,
  name: model.name,
  email: model.email,
  phone: model.phone,
})
