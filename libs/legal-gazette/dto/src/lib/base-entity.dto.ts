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

export class DetailedDto {
  @ApiProperty({
    type: String,
    description: 'ISO representation of the creation date',
    example: '2021-08-31T12:00:00.000Z',
  })
  readonly createdAt!: string

  @ApiProperty({
    type: String,
    description: 'ISO representation of the updated date',
    example: '2021-08-31T12:00:00.000Z',
  })
  readonly updatedAt!: string

  @ApiProperty({
    type: String,
    description: 'ISO representation of the deletion date',
    example: '2021-08-31T12:00:00.000Z',
    required: false,
    nullable: true,
  })
  readonly deletedAt!: string | null
}
