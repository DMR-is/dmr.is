import beygla from 'beygla'

import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { LegalGazetteModels } from '../core/constants'
import { BaseEntityDto } from '../modules/base-entity/base-entity.dto'
@BaseEntityTable({ tableName: LegalGazetteModels.COURT_DISTRICT })
export class CourtDistrictModel extends BaseEntityModel<CourtDistrictDto> {
  // returns the title in "eignarfall"
  get possessiveTitle(): string {
    return this.title ? beygla.applyCase('ef', this.title) : ''
  }
}

export class CourtDistrictDto extends BaseEntityDto {}

export class GetCourtDistrictsDto {
  @ApiProperty({
    type: [CourtDistrictDto],
  })
  courtDistricts!: CourtDistrictDto[]
}
