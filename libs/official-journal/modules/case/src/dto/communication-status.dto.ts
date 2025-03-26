import { ApiProperty } from '@nestjs/swagger'

import { CaseCommunicationStatus } from '../cases'

export class CommunicationStatus {
  @ApiProperty({
    type: String,
    description: 'The id of the communication status',
  })
  readonly id!: string

  @ApiProperty({
    enum: CaseCommunicationStatus,
    description: 'The title of the communication status',
  })
  title!: CaseCommunicationStatus

  @ApiProperty({
    type: String,
    description: 'The slug of the communication status',
  })
  slug!: string
}
