import { CaseChannel } from '@dmr.is/shared/dto'

import { CaseChannelModel } from '../models'

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
