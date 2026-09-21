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

/**
 * Re-points an instant so that its *local* components read as Icelandic
 * wall-clock time, letting `date-fns` format it without a timezone database.
 *
 * Iceland observes GMT all year and has no DST, so Icelandic wall-clock time is
 * simply UTC. The returned Date is a formatting vehicle only - as an instant it
 * is deliberately wrong, so never let one escape this module.
 */
const toIcelandicWallClock = (date: Date) =>
  new Date(date.getTime() + date.getTimezoneOffset() * 60_000)

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
 */
export const formatDateInIceland = (
  date: Date | string,
  dateFormat: (typeof dateFormats)[number] = 'dd.MM.yyyy',
  locale = is,
) => {
  const dateToFormat = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateToFormat.getTime())) {
    throw new Error(`Invalid date: ${date}`)
  }

  return formatDate(toIcelandicWallClock(dateToFormat), dateFormat, locale)
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
