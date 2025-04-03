import { CaseCommunicationStatusEnum } from '@dmr.is/official-journal/models'

import { ApiProperty } from '@nestjs/swagger'

export class CommunicationStatus {
  @ApiProperty({
    type: String,
    description: 'The id of the communication status',
  })
  readonly id!: string

  @ApiProperty({
    enum: CaseCommunicationStatusEnum,
    description: 'The title of the communication status',
  })
  title!: CaseCommunicationStatusEnum

  @ApiProperty({
    type: String,
    description: 'The slug of the communication status',
  })
  slug!: string
}
