import { ApiProperty } from '@nestjs/swagger'

export class CaseChannel {
  @ApiProperty({
    type: String,
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Id of the case channel.',
  })
  readonly id!: string

  @ApiProperty({
    type: String,
    example: 'hjalp@dmr.is',
    description: 'Email of the case channel.',
  })
  email!: string

  @ApiProperty({
    type: String,
    example: '+354 123 4567',
    description: 'Phone of the case channel.',
  })
  phone!: string
}
