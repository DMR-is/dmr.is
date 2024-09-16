import { AdvertStatus } from '@dmr.is/shared/dto'

import { AdvertStatusModel } from '../models/advert-status.model'

export function advertStatusMigrate(model: AdvertStatusModel): AdvertStatus {
  switch (model.title) {
    case AdvertStatus.Active:
      return AdvertStatus.Active
    case AdvertStatus.Draft:
      return AdvertStatus.Draft
    case AdvertStatus.InProgress:
      return AdvertStatus.InProgress
    case AdvertStatus.Old:
      return AdvertStatus.Old
    case AdvertStatus.Published:
      return AdvertStatus.Published
    case AdvertStatus.ReadyForPublication:
      return AdvertStatus.ReadyForPublication
    case AdvertStatus.Rejected:
      return AdvertStatus.Rejected
    case AdvertStatus.Revoked:
      return AdvertStatus.Revoked
    case AdvertStatus.Submitted:
      return AdvertStatus.Submitted
    case AdvertStatus.Waiting:
      return AdvertStatus.Waiting
    default:
      return AdvertStatus.Draft
  }
}
