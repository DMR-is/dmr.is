import { toPossessiveCourtDistrict } from '@dmr.is/legal-gazette-html'
import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { BaseEntityDto } from '../modules/base-entity/dto/base-entity.dto'

@BaseEntityTable({ tableName: LegalGazetteModels.COURT_DISTRICT })
export class CourtDistrictModel extends BaseEntityModel<CourtDistrictDto> {
  // returns the title in "eignarfall"
  get possessiveTitle(): string {
    return toPossessiveCourtDistrict(this.title)
  }
}

export class CourtDistrictDto extends BaseEntityDto {}
