import { ApiProperty } from '@nestjs/swagger'

import { Department } from '../departments'

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
    type: Department,
    description: 'The department of the main advert type',
    required: true,
  })
  department!: Department
}
