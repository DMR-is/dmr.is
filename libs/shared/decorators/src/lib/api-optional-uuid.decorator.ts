import { IsOptional, IsUUID } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

type ApiOptionalUuidOptions = Omit<ApiPropertyOptions, 'required' | 'type'>

export function ApiOptionalUuid(options: ApiOptionalUuidOptions = {}) {
  return applyDecorators(
    ApiProperty({
      type: String,
      format: 'uuid',
      required: false,
      ...options,
    }),
    IsOptional(),
    IsUUID(),
  )
}

export const ApiOptionalUUID = ApiOptionalUuid
