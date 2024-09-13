import { CommunicationStatus } from '@dmr.is/shared/dto'

import { CaseCommunicationStatusModel } from '../models'

export const caseCommunicationStatusMigrate = (
  model: CaseCommunicationStatusModel,
): CommunicationStatus => {
  const migrated: CommunicationStatus = {
    id: model.id,
    title: model.title,
    slug: model.slug,
  }

  return migrated
}
