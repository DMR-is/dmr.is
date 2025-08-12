import { ApiProperty } from '@nestjs/swagger'

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
