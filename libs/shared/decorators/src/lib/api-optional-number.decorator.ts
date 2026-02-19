import { IsNumber, IsOptional } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiOptionalNumber(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({
      ...options,
      type: Number,
      required: false,
    }),
    IsOptional(),
    IsNumber(),
  )
}
