import { Transform, Type } from 'class-transformer'
import { IsArray, IsDate, IsOptional } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

import { parseDateValue } from './parse-date-value.util'

export function ApiOptionalDateTimeArray(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty(
      {
        type: String,
        isArray: true,
        format: 'date-time',
        example: ['2026-02-19T10:30:00.000Z'],
        required: false,
        ...options,
      } as ApiPropertyOptions,
    ),
    IsOptional(),
    Transform(({ value }) =>
      Array.isArray(value) ? value.map((item) => parseDateValue(item)) : value,
    ),
    Type(() => Date),
    IsArray(),
    IsDate({ each: true }),
  )
}
