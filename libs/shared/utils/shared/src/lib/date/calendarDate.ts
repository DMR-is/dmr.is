const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Re-expresses an instant so that formatting it with a timezone-unaware
 * formatter (date-fns, `Intl` without a `timeZone`) yields the Reykjavik wall
 * clock rather than the wall clock of whatever process happens to run.
 *
 * Atlantic/Reykjavik is UTC+0 all year round, so the Icelandic wall clock is the
 * UTC wall clock - no tz database and no `date-fns-tz` needed.
 *
 * Built from the UTC parts rather than by adding `getTimezoneOffset()`: that
 * offset is read at the original instant but the formatter applies the offset at
 * the shifted one, so around a DST transition in the *reader's* zone the two
 * disagree. That costs an hour in Berlin and a whole calendar day in Auckland,
 * Santiago and Lord Howe. The one case this still cannot represent is an instant
 * landing in a skipped hour, where the runtime moves it forward; the calendar day
 * survives that, which is what the adverts turn on.
 */
export const atReykjavik = (date: Date) =>
  new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  )

/**
 * Snaps an instant to the UTC midnight it is closest to.
 *
 * Fields like urskurdardagur, frestdagur and skiptalok are calendar days, but
 * every date picker in the product hands us browser-local midnight serialised
 * with `toISOString()`. From a browser at UTC+2 that is 22:00 on the *previous*
 * day, so truncating would keep the wrong day - rounding recovers the day the
 * user actually picked for any offset in (-12, +12).
 */
export const toCalendarDate = (date: Date) =>
  new Date(Math.round(date.getTime() / MS_PER_DAY) * MS_PER_DAY)

/**
 * Serialises the calendar day a date picker returned.
 *
 * Pickers hand back a `Date` at browser-local midnight; `toISOString()` on that
 * carries the browser's offset into storage, which is how a day picked at UTC+2
 * ended up stored as the previous day. Reading the local Y/M/D and re-anchoring
 * at UTC midnight sends the day the user saw, not the instant their clock was at.
 */
export const toCalendarDateIso = (date: Date) => {
  // Mirrors the guard in fromCalendarDateIso. Without it an unparseable date
  // reaches toISOString() and throws RangeError rather than producing the empty
  // value every caller already handles.
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString()
}

/**
 * Inverse of {@link toCalendarDateIso}: turns a stored calendar day back into a
 * local-midnight `Date` so a picker highlights the day it actually represents.
 */
export const fromCalendarDateIso = (value: Date | string) => {
  const parsed = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return new Date(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  )
}

/**
 * Serialises the date *and time* a picker returned, read as a Reykjavik wall
 * clock.
 *
 * `toISOString()` on the picker's `Date` turns the clock face the user typed
 * into an absolute instant, so "kl. 14:00" entered from a browser at UTC+2
 * publishes as `kl. 12:00` - the lawyer picks a time for a skiptafundur held in
 * Reykjavik and the advert names a different one. Re-anchoring the local
 * Y/M/D H:M at UTC sends the clock face instead, which is what the field asks
 * for and what the advert prints.
 *
 * Use this for fields that carry a real time of day; {@link toCalendarDateIso}
 * is the equivalent for fields that are only a day.
 */
export const toReykjavikDateTimeIso = (date: Date) => {
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    ),
  ).toISOString()
}

/**
 * Inverse of {@link toReykjavikDateTimeIso}: turns a stored instant back into a
 * `Date` whose local clock face is the Reykjavik one, so a picker shows the time
 * that will be printed. This is the same operation as {@link atReykjavik}, named
 * for the picker call sites.
 */
export const fromReykjavikDateTimeIso = (value: Date | string) => {
  const parsed = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return parsed
  }

  return atReykjavik(parsed)
}
