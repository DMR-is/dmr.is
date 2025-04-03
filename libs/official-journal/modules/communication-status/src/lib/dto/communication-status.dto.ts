import { CommunicationStatus } from '@dmr.is/official-journal/dto/communication-status/communication-status.dto'

import { ApiProperty } from '@nestjs/swagger'

export class GetCommunicationSatusesResponse {
  @ApiProperty({
    type: [CommunicationStatus],
    description: 'List of communication statuses',
  })
  statuses!: CommunicationStatus[]
}
