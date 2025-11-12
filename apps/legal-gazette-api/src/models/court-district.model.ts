import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityModel, BaseEntityTable } from '@dmr.is/shared/models/base'

import { BaseEntityDto } from '../dto/base-entity.dto'
import { LegalGazetteModels } from '../lib/constants'

@BaseEntityTable({ tableName: LegalGazetteModels.COURT_DISTRICT })
export class CourtDistrictModel extends BaseEntityModel<CourtDistrictDto> {}

export class CourtDistrictDto extends BaseEntityDto {}

export class GetCourtDistrictsDto {
  @ApiProperty({
    type: [CourtDistrictDto],
  })
  courtDistricts!: CourtDistrictDto[]
}
