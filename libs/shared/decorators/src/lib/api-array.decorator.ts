import { IsArray } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'


export function ApiArray(options: ApiPropertyOptions = {}) {
  return applyDecorators(
    ApiProperty(options),
    IsArray(),
  )
}
