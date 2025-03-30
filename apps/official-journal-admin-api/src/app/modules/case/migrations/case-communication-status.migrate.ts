import {
  CaseCommunicationStatusEnum,
  CaseCommunicationStatusModel,
} from '@dmr.is/official-journal/models'
import { enumMapper } from '@dmr.is/utils'

import { CommunicationStatus } from '../dto/communication-status.dto'

export const caseCommunicationStatusMigrate = (
  model: CaseCommunicationStatusModel,
): CommunicationStatus => {
  const migrated: CommunicationStatus = {
    id: model.id,
    title: enumMapper(model.title, CaseCommunicationStatusEnum),
    slug: model.slug,
  }

  return migrated
}
