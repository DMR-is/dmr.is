import { Transform, Type } from 'class-transformer'
import { IsDate, IsOptional } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

import { parseCalendarDateValue } from './parse-calendar-date-value.util'

/**
 * Optional counterpart to {@link ApiDate}. See that decorator for why calendar
 * days are normalised to UTC midnight.
 */
export function ApiOptionalDate(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({
      type: String,
      format: 'date-time',
      example: '2026-02-19T00:00:00.000Z',
      required: false,
      ...options,
    } as ApiPropertyOptions),
    IsOptional(),
    Transform(({ value }) => parseCalendarDateValue(value)),
    Type(() => Date),
    IsDate(),
  )
}
