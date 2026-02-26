import { ApiProperty } from '@nestjs/swagger'

import { FeeCodeDto } from '../../../models/fee-code.model'

export class GetFeeCodesResponse {
  @ApiProperty({ type: [FeeCodeDto] })
  feeCodes!: FeeCodeDto[]
}
