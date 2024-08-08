import { CommunicationStatus } from '@dmr.is/shared/dto'

import { CaseCommunicationStatusDto } from '../../../case/models'

export const caseCommunicationStatusMigrate = (
  model: CaseCommunicationStatusDto,
): CommunicationStatus => {
  const migrated: CommunicationStatus = {
    id: model.id,
    value: model.value,
  }

  return migrated
}
