import { ApiProperty } from '@nestjs/swagger'

import { ApiDateTime, ApiOptionalDateTime } from '@dmr.is/decorators'

export class DetailedDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  readonly id!: string

  @ApiDateTime({
    description: 'ISO representation of the creation date',
    example: '2021-08-31T12:00:00.000Z',
  })
  readonly createdAt!: Date

  @ApiDateTime({
    description: 'ISO representation of the updated date',
    example: '2021-08-31T12:00:00.000Z',
  })
  readonly updatedAt!: Date

  @ApiOptionalDateTime({
    description: 'ISO representation of the deletion date',
    example: '2021-08-31T12:00:00.000Z',
    nullable: true,
  })
  readonly deletedAt?: Date
}
