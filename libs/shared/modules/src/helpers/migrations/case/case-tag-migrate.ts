import { CaseTag } from '@dmr.is/shared/dto'

import { CaseTagDto } from '../../../case/models'
import { caseTagMapper } from '../../mappers/case/tag.mapper'

export const caseTagMigrate = (model: CaseTagDto): CaseTag => {
  try {
    const mapped: CaseTag = {
      id: model.id,
      value: caseTagMapper(model.value)!,
      key: model.key,
    }

    return mapped
  } catch (e) {
    throw new Error(`Error migrating case channel: ${e}`)
  }
}
