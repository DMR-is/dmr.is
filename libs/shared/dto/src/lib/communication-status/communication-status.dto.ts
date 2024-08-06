import { ApiProperty } from '@nestjs/swagger'

export class CommunicationStatus {
  @ApiProperty({
    type: String,
    description: 'The id of the communication status',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    description: 'The value of the communication status',
  })
  value!: string
}
