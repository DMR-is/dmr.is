import {
  CaseCommunicationStatus,
  CommunicationStatus,
} from '@dmr.is/shared-dto'
import { enumMapper } from '@dmr.is/utils/server/serverUtils'

import { CaseCommunicationStatusModel } from '../models'

export const caseCommunicationStatusMigrate = (
  model: CaseCommunicationStatusModel,
): CommunicationStatus => {
  const migrated: CommunicationStatus = {
    id: model.id,
    title: enumMapper(model.title, CaseCommunicationStatus),
    slug: model.slug,
  }

  return migrated
}
