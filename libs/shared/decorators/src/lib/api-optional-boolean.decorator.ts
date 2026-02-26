import { IsBoolean, IsOptional } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

type ApiOptionalBooleanOptions = Omit<ApiPropertyOptions, 'required' | 'type'>

export function ApiOptionalBoolean(options: ApiOptionalBooleanOptions = {}) {
  return applyDecorators(
    ApiProperty({
      type: Boolean,
      required: false,
      ...options,
    }),
    IsOptional(),
    IsBoolean(),
  )
}
