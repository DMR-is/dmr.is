import { ApiProperty } from '@nestjs/swagger'

import { AdvertType } from '@dmr.is/official-journal/modules/advert-type'
import { BaseEntity } from '@dmr.is/shared/dto'

export class ApplicationCase {
  @ApiProperty({
    type: [BaseEntity],
  })
  categories!: BaseEntity[]

  @ApiProperty({
    type: BaseEntity,
    description: 'Current status of the case',
  })
  status!: BaseEntity

  @ApiProperty({
    type: BaseEntity,
  })
  communicationStatus!: BaseEntity

  @ApiProperty({
    type: BaseEntity,
  })
  department!: BaseEntity

  @ApiProperty({
    type: BaseEntity,
  })
  type!: BaseEntity

  @ApiProperty({
    type: String,
  })
  html!: string
}
