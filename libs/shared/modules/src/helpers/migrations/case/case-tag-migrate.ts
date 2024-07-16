import { CaseTag } from '@dmr.is/shared/dto'

import { CaseTagDto } from '../../../case/models'

export const caseTagMigrate = (model: CaseTagDto): CaseTag => {
  try {
    const mapped: CaseTag = {
      id: model.id,
      value: model.value,
      key: model.key,
    }

    return mapped
  } catch (e) {
    throw new Error(`Error migrating case channel: ${e}`)
  }
}
