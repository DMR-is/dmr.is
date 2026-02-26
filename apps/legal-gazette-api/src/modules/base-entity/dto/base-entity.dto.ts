import { ApiProperty } from '@nestjs/swagger'

export class BaseEntityDto {
  @ApiProperty({
    type: String,
    description: 'UUIDV4 of the entity',
    example: '182391f7-d355-46f0-bcee-4d8baa68b55d',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    description: 'Title of the entity',
    example: 'Base entity',
  })
  readonly title!: string

  @ApiProperty({
    type: String,
    description: 'Slug of the entity',
    example: 'base-entity',
  })
  slug!: string
}
