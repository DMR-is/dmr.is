import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '@dmr.is/legal-gazette/dto'

export class GetAdvertStatusesDto {
  @ApiProperty({
    type: [BaseEntityDto],
  })
  statuses!: BaseEntityDto[]
}

export class AdvertStatusDto extends BaseEntityDto {}
