import { CaseChannelModel } from '@dmr.is/official-journal/models'
import { CaseChannel } from '../dto/case-channel.dto'

export const caseChannelMigrate = (model: CaseChannelModel): CaseChannel => {
  try {
    const mapped = {
      id: model.id,
      name: model.name,
      email: model.email,
      phone: model.phone,
    }

    return mapped
  } catch (e) {
    throw new Error(`Error migrating case channel: ${e}`)
  }
}
