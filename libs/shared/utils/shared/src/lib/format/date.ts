import format from 'date-fns/format'
import is from 'date-fns/locale/is'

const dateFormats = [
  'd.MM.yyyy',
  'dd.MM.yyyy',
  'd. MMMM yyyy',
  'dd. MMMM yyyy',
  'HH:mm',
  'MMMM',
  'EEEE',
  "dd. MMMM yyyy 'kl.' HH:mm",
  "d.MM.yy 'kl.' HH:mm",
] as const

const TIME_SUFFIX = 'HH:mm'

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * Formats a date in Iceland's timezone rather than the viewer's.
 *
 * Prefer this over `formatDate` for anything rendered on the server. Plain
 * `formatDate` resolves in the *runtime's* zone, so a server-rendered timestamp
 * and its client re-render disagree wherever the two zones differ - a hydration
 * mismatch that is invisible in production (UTC server, GMT users) and fires on
 * any dev machine off GMT.
 *
 * It is also the more correct reading: these are Icelandic publication times,
 * and a viewer abroad should not see them shifted into their own zone.
 *
 * Iceland observes GMT all year with no DST, so its wall clock is exactly UTC
 * and the `getUTC*` accessors give the fields to render.
 *
 * The date fields are formatted through a Date built at *local noon* on that
 * calendar day. That sidesteps the trap an offset shift falls into: nudging an
 * instant by `getTimezoneOffset()` samples the offset on the wrong side of the
 * viewer's own DST transition, and midnight-adjacent times can land in an hour
 * that does not exist locally and get silently normalised. Noon is never inside
 * a transition, so the calendar day always survives the round trip. The time
 * fields never go through a Date at all.
 */
export const formatDateInIceland = (
  date: Date | string,
  dateFormat: (typeof dateFormats)[number] = 'dd.MM.yyyy',
  locale = is,
) => {
  const instant = typeof date === 'string' ? new Date(date) : date

  if (isNaN(instant.getTime())) {
    throw new Error(`Invalid date: ${date}`)
  }

  const time = `${pad(instant.getUTCHours())}:${pad(instant.getUTCMinutes())}`

  if (dateFormat === TIME_SUFFIX) {
    return time
  }

  const noonOnIcelandicDay = new Date(
    instant.getUTCFullYear(),
    instant.getUTCMonth(),
    instant.getUTCDate(),
    12,
  )

  if (!dateFormat.endsWith(TIME_SUFFIX)) {
    return formatDate(noonOnIcelandicDay, dateFormat, locale)
  }

  // e.g. "dd. MMMM yyyy 'kl.' HH:mm" -> "dd. MMMM yyyy 'kl.' " + "13:45"
  const datePart = dateFormat.slice(0, -TIME_SUFFIX.length)

  return (
    formatDate(
      noonOnIcelandicDay,
      datePart as (typeof dateFormats)[number],
      locale,
    ) + time
  )
}

export const formatDate = (
  date: Date | string,
  dateFormat: (typeof dateFormats)[number] = 'dd.MM.yyyy',
  locale = is,
) => {
  const dateToFormat = typeof date === 'string' ? new Date(date) : date

  if (dateToFormat instanceof Date && !isNaN(dateToFormat.getTime())) {
    return format(dateToFormat, dateFormat, { locale })
  }

  throw new Error(`Invalid date: ${date}`)
}
