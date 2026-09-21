import { toCalendarDate } from '@dmr.is/utils-shared/date/calendarDate'

import { parseDateValue } from './parse-date-value.util'

/**
 * Parses an incoming value the way {@link parseDateValue} does, then snaps it to
 * the calendar day the user picked. See `toCalendarDate` for why rounding rather
 * than truncating is what recovers the intended day.
 */
export function parseCalendarDateValue(value: unknown): unknown {
  const parsed = parseDateValue(value)

  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return toCalendarDate(parsed)
}
