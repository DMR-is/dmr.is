import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'

import { ApiProperty } from '@nestjs/swagger'

export class GetAllFeeCodesParams {
  @ApiProperty({
    description: 'Include base codes in response.',
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  excludeBaseCodes?: boolean
}
