import { Institution } from '@dmr.is/shared-dto'

import { advertInvolvedPartyMigrate } from '../../journal/migrations'
import { AdditionalPartiesModel } from '../models'

export function additionalPartiesMigrate(
  models?: AdditionalPartiesModel[],
): Institution[] {
  return (
    models
      ?.filter((model) => model.involvedParty)
      .map((model) => advertInvolvedPartyMigrate(model.involvedParty)) ?? []
  )
}
