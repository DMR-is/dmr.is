import { CaseChannel } from '@dmr.is/shared/dto'

import { CaseChannelDto } from '../../../case/models'

export const caseChannelMigrate = (model: CaseChannelDto): CaseChannel => {
  try {
    const mapped = {
      id: model.id,
      email: model.email,
      phone: model.phone,
    }

    return mapped
  } catch (e) {
    throw new Error(`Error migrating case channel: ${e}`)
  }
}
