import { IsString } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiString(options: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({
      type: String,
      ...options,
    }),
    IsString(),
  )
}
