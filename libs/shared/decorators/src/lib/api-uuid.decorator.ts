import { IsUUID } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

export function ApiUUId(options: ApiPropertyOptions = {}) {
  return applyDecorators(
    ApiProperty({
      type: String,
      format: 'uuid',
      ...options,
    }),
    IsUUID(),
  )
}

export const ApiUUID = ApiUUId
