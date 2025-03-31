import { ApiProperty } from '@nestjs/swagger'
import { BaseEntity } from '@dmr.is/shared/dto'

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

  @ApiProperty({
    description: 'National ID of the institution',
    example: '650376-2949',
    required: true,
    type: String,
  })
  readonly nationalId!: string
}

export class InstitutionDto extends BaseEntity {
  @ApiProperty({
    description: 'National ID of the institution',
    type: String,
  })
  nationalId!: string
}
