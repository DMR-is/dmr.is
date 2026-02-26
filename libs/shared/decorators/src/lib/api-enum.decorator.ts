import { IsEnum } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiEnum<T extends Record<string, string | number>>(
  enumRef: T,
  options: ApiPropertyOptions = {},
) {
  return applyDecorators(
    ApiProperty({
      enum: enumRef,
      ...options,
    }),
    IsEnum(enumRef),
  )
}
