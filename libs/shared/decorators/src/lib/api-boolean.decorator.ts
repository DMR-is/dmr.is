import { IsBoolean } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiBoolean(options: ApiPropertyOptions = {}) {
  return applyDecorators(
    ApiProperty({
      type: Boolean,
      ...options,
    }),
    IsBoolean(),
  )
}
