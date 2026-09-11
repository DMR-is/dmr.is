import { Transform, Type } from 'class-transformer'
import { IsDate } from 'class-validator'

import { applyDecorators } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger'

import { parseCalendarDateValue } from './parse-calendar-date-value.util'

/**
 * For calendar days (urskurdardagur, frestdagur, danardagur, skiptalok), as
 * opposed to {@link ApiDateTime} which is for instants that carry a real time of
 * day. Normalises to UTC midnight so the stored value no longer depends on the
 * timezone of the browser that picked it.
 *
 * The wire format stays `date-time`: the value is still a full ISO instant, it
 * is just pinned to midnight. Declaring `date` here would flip every generated
 * client's type from `Date` to `string` without making the contract any truer.
 */
export function ApiDate(options?: ApiPropertyOptions) {
  return applyDecorators(
    ApiProperty({
      type: String,
      format: 'date-time',
      example: '2026-02-19T00:00:00.000Z',
      ...options,
    }),
    Transform(({ value }) => parseCalendarDateValue(value)),
    Type(() => Date),
    IsDate(),
  )
}
