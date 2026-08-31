/**
 * Formatting shared by the mail templates.
 *
 * Each template used to carry its own copy of `escapeHtml`, identical in all
 * three. They are here so a fix to the escaping reaches every outbound message
 * rather than the one that happened to be edited.
 *
 * Deliberately separate from `report-pdf/lib/format.ts`, which formats currency,
 * percentages and hourly rates for a document. These two overlap on dates only,
 * and the PDF module's helpers are internal to it.
 */

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Icelandic day-first date, or an em dash when there is nothing to show.
 *
 * ⚠️ Reads the date's **local** parts, matching the deadline reminder this was
 * lifted from. Every value it is given is a `DATE`/`TIMESTAMP` column read back
 * by Sequelize, and the API runs in Atlantic/Reykjavik (UTC+0 year-round), so
 * local and UTC agree. A `DATEONLY` string must NOT come through here — those
 * are calendar dates and shifting them by a timezone is exactly the bug
 * `formatIsoDate` in the PDF module exists to avoid.
 */
export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()}`
}
