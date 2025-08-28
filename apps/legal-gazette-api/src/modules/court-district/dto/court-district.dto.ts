import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '../../../dto/base-entity.dto'

export class CourtDistrictDto extends BaseEntityDto {}

export class GetCourtDistrictsDto {
  @ApiProperty({
    type: [CourtDistrictDto],
  })
  courtDistricts!: CourtDistrictDto[]
}
