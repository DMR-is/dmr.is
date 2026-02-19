import { Type } from 'class-transformer'
import { IsDate } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'


/**
 * Parses the incoming iso string to a Date object
 */
export function ApiDateTime(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({
      type: String,
      format: 'date-time',
      example: '2026-02-19T10:30:00.000Z',
      ...options,
    }),
    Type(() => Date),
    IsDate(),
  )
}
