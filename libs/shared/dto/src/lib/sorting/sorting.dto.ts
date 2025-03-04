import { ApiProperty } from '@nestjs/swagger'

export class Sorting {
  @ApiProperty({ type: String, example: 'date' })
  sortBy!: string

  @ApiProperty({ type: String, example: 'asc' })
  direction!: string
}
