import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '@dmr.is/legal-gazette/dto'

export class GetStatusesDto {
  @ApiProperty({
    type: [BaseEntityDto],
  })
  statuses!: BaseEntityDto[]
}

export class StatusDto extends BaseEntityDto {}
