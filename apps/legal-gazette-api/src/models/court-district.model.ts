import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared-models-base'

import { LegalGazetteModels } from '../core/constants'
import { BaseEntityDto } from '../modules/base-entity/dto/base-entity.dto'

@BaseEntityTable({ tableName: LegalGazetteModels.COURT_DISTRICT })
export class CourtDistrictModel extends BaseEntityModel<CourtDistrictDto> {
  // returns the title in "eignarfall"
  get possessiveTitle(): string {
    const possesive = this.title.replace('Héraðsdómur', 'Héraðsdóms')

    return possesive
  }
}

export class CourtDistrictDto extends BaseEntityDto {}
