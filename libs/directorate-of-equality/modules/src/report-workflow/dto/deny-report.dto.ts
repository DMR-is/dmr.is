import { IsNotEmpty, IsString } from 'class-validator'

import { ApiString } from '@dmr.is/decorators'

export class DenyReportDto {
  @ApiString()
  @IsString()
  @IsNotEmpty()
  denialReason!: string
}
