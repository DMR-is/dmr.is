import { IsString, MaxLength, MinLength } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiString(
  options: ApiPropertyOptions & { minLength?: number; maxLength?: number } = {},
) {
  const { minLength, maxLength, ...apiOptions } = options
  const decorators = [
    ApiProperty({
      type: String,
      minLength,
      maxLength,
      ...apiOptions,
    }),
    IsString(),
  ]

  if (minLength !== undefined) decorators.push(MinLength(minLength))
  if (maxLength !== undefined) decorators.push(MaxLength(maxLength))

  return applyDecorators(...decorators)
}
