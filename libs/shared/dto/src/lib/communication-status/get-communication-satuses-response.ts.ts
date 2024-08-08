import { ApiProperty } from '@nestjs/swagger'

import { CommunicationStatus } from './communication-status.dto'

export class GetCommunicationSatusesResponse {
  @ApiProperty({
    type: [CommunicationStatus],
    description: 'List of communication statuses',
  })
  statuses!: CommunicationStatus[]
}
