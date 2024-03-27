import { ApiProperty } from '@nestjs/swagger'
import { Department } from '../departments/department.dto'

export class AdvertType {
  @ApiProperty({
    description: 'Unique ID for the advert type, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Title of the advert type, always uppercased.',
    example: 'AUGLÝSING',
    required: true,
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    description: 'Slug of the advert type, used in URLs and API requests.',
    example: 'auglysing',
    required: true,
    type: String,
  })
  readonly slug!: string

  @ApiProperty({
    description: 'Department the advert type belongs to.',
    required: true,
    nullable: false,
    type: Department,
  })
  readonly department!: Department
}
