import { IsOptional, IsString } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

type ApiOptionalStringOptions = Omit<ApiPropertyOptions, 'required' | 'type'>

export function ApiOptionalString(options: ApiOptionalStringOptions = {}) {
  return applyDecorators(
    ApiProperty({
      ...options,
      type: String,
      required: false,
    }),
    IsOptional(),
    IsString(),
  )
}
