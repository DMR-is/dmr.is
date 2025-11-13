import { ApiProperty } from '@nestjs/swagger'

import { BaseEntityDto } from '../../../dto/base-entity.dto'
import { StatusEnum, StatusIdEnum } from '../../../models/status.model'

export class GetStatusesDto {
  @ApiProperty({
    type: [BaseEntityDto],
  })
  statuses!: BaseEntityDto[]
}

export class StatusDto {
  @ApiProperty({
    type: String,
    enum: StatusIdEnum,
    enumName: 'StatusIdEnum',
  })
  id!: string

  @ApiProperty({
    type: String,
    enum: StatusEnum,
    enumName: 'StatusEnum',
  })
  title!: string

  @ApiProperty({
    type: String,
  })
  slug!: string
}
