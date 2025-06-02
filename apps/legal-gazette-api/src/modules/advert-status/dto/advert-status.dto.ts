import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDetailedDto, BaseEntityDto } from '@dmr.is/legal-gazette/dto'

export class GetAdvertStatusesDto {
  @ApiProperty({
    type: [BaseEntityDto],
  })
  statuses!: BaseEntityDto[]
}

export class GetAdvertStatusesDetailedDto {
  @ApiProperty({
    type: [BaseEntityDetailedDto],
  })
  statuses!: BaseEntityDetailedDto[]
}

export class AdvertStatusDto extends BaseEntityDto {}

export class AdvertStatusDetailedDto extends BaseEntityDetailedDto {}
