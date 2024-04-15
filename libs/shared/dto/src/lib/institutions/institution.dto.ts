import { ApiProperty } from '@nestjs/swagger'

export class Institution {
  @ApiProperty({
    description: 'Unique ID for the institution, GUID format.',
    example: '00000000-0000-0000-0000-000000000000',
    required: true,
    nullable: false,
    type: String,
  })
  readonly id!: string

  @ApiProperty({
    description: 'Title of the institution',
    example: 'Dómsmálaráðuneytið',
    required: true,
    type: String,
  })
  readonly title!: string

  @ApiProperty({
    description: 'Slug of the institution, used in URLs and API requests.',
    example: 'domsmalaraduneytid',
    required: true,
    type: String,
  })
  readonly slug!: string
}
