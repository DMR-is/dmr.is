import { OJOIApplication } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'

export class GetApplicationResponse {
  @ApiProperty({
    type: OJOIApplication,
    required: true,
  })
  readonly application!: OJOIApplication
}
