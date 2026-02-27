import { IsNumber } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiNumber(options: ApiPropertyOptions = {}) {
  return applyDecorators(
    ApiProperty({
      type: Number,
      ...options,
    }),
    IsNumber(),
  )
}
