import { ApiProperty } from '@nestjs/swagger'

import { Institution } from '../institutions'

export class ApplicationUserInvolvedPartiesResponse {
  @ApiProperty({
    type: [Institution],
    required: true,
  })
  involvedParties!: Institution[]
}
