import { Transform, Type } from 'class-transformer'
import { IsDate, IsOptional } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

function parseDateValue(value: unknown): unknown {
  if (value === null || value === undefined || value === '') {
    return value
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return value
}

export function ApiOptionalDateTime(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty(
      {
        type: String,
        format: 'date-time',
        example: '2026-02-19T10:30:00.000Z',
        required: false,
        ...options,
      } as ApiPropertyOptions,
    ),
    IsOptional(),
    Transform(({ value }) => parseDateValue(value)),
    Type(() => Date),
    IsDate(),
  )
}
