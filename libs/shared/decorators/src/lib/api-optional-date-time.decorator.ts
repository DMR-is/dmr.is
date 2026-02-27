import { Transform, Type } from 'class-transformer'
import { IsDate, IsOptional } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

import { parseDateValue } from './parse-date-value.util'

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
