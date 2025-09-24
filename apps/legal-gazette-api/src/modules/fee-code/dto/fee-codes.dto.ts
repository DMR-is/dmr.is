import { IsUUID } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class FeeCodeDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id!: string

  @ApiProperty({ type: String })
  feeCode!: string

  @ApiProperty({ type: String })
  description!: string

  @ApiProperty({ type: Number })
  value!: number

  @ApiProperty({ type: Boolean })
  isMultiplied!: boolean
}

export class GetFeeCodesResponse {
  @ApiProperty({ type: [FeeCodeDto] })
  feeCodes!: FeeCodeDto[]
}
