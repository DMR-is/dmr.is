import { IsEnum, IsOptional } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiOptionalEnum<T extends Record<string, string | number>>(
  enumRef: T,
  options: ApiPropertyOptions = {},
) {
  return applyDecorators(
    ApiProperty(
      {
        enum: enumRef,
        required: false,
        ...options,
      } as ApiPropertyOptions,
    ),
    IsOptional(),
    IsEnum(enumRef),
  )
}
