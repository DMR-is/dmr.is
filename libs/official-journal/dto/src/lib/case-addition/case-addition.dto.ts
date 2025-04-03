import { ApiProperty } from '@nestjs/swagger'

export class CaseAddition {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    description: 'Title of the addition',
  })
  readonly title!: string

  @ApiProperty({
    type: String,
    description: 'HTML of the addition',
  })
  html!: string
}
