import { BaseEntity } from '@dmr.is/shared/dto'
import { ApiProperty } from '@nestjs/swagger'

export class AdvertType {
  @ApiProperty({
    type: 'string',
    description: 'The id of the main advert type',
    required: true,
  })
  id!: string

  @ApiProperty({
    type: 'string',
    description: 'The title of the main advert type',
    required: true,
  })
  title!: string

  @ApiProperty({
    type: 'string',
    description: 'The slug of the main advert type',
    required: true,
  })
  slug!: string

  @ApiProperty({
    type: BaseEntity,
    description: 'The department of the main advert type',
    required: true,
  })
  department!: BaseEntity
}

export class AdvertMainType {
  @ApiProperty({
    type: 'string',
    description: 'The id of the main advert type',
    required: true,
  })
  id!: string

  @ApiProperty({
    type: 'string',
    description: 'The title of the main advert type',
    required: true,
  })
  title!: string

  @ApiProperty({
    type: 'string',
    description: 'The slug of the main advert type',
    required: true,
  })
  slug!: string

  @ApiProperty({
    type: BaseEntity,
    description: 'The department this main type belongs to',
    required: true,
  })
  department!: BaseEntity

  @ApiProperty({
    type: [AdvertType],
    description: 'All types under this main type',
    required: true,
  })
  types!: AdvertType[]
}
