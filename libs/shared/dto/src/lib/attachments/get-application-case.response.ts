import { ApiProperty } from '@nestjs/swagger'

import { ApplicationCase } from './application-case.dto'

export class GetApplicationCaseResponse {
  @ApiProperty({
    type: [ApplicationCase],
  })
  applicationCase!: ApplicationCase[]
}
