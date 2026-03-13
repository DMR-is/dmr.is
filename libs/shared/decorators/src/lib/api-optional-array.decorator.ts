import { IsArray, IsOptional } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'


export function ApiOptionalArray(
  options: ApiPropertyOptions = {},
) {
  return applyDecorators(
    ApiProperty({
      ...options,
      required: false,
    } as ApiPropertyOptions),
    IsOptional(),
    IsArray(),
  )
}
