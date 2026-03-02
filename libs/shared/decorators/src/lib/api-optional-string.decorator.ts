import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

type ApiOptionalStringOptions = Omit<ApiPropertyOptions, 'required' | 'type'> & {
  minLength?: number
  maxLength?: number
}

export function ApiOptionalString(options: ApiOptionalStringOptions = {}) {
  const { minLength, maxLength, ...apiOptions } = options
  const decorators = [
    ApiProperty({
      ...apiOptions,
      type: String,
      required: false,
      minLength,
      maxLength,
    }),
    IsOptional(),
    IsString(),
  ]

  if (minLength !== undefined) decorators.push(MinLength(minLength))
  if (maxLength !== undefined) decorators.push(MaxLength(maxLength))

  return applyDecorators(...decorators)
}
