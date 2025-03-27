import { ApiProperty } from '@nestjs/swagger'

import { Application } from './application.dto'

export class GetApplicationResponse {
  @ApiProperty({
    type: Application,
    required: true,
  })
  readonly application!: Application
}
