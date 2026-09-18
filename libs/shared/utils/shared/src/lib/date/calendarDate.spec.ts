import {
  atReykjavik,
  fromCalendarDateIso,
  fromReykjavikDateTimeIso,
  toCalendarDate,
  toCalendarDateIso,
  toReykjavikDateTimeIso,
} from './calendarDate'

describe('toCalendarDate', () => {
  const utcMidnight = '2026-05-06T00:00:00.000Z'

  it.each([
    ['a browser at UTC+2', '2026-05-05T22:00:00.000Z'],
    ['a browser at UTC+12', '2026-05-05T12:00:00.000Z'],
    ['a browser at UTC-4', '2026-05-06T04:00:00.000Z'],
    ['a browser at UTC+0', utcMidnight],
  ])('recovers the picked calendar day from %s', (_label, input) => {
    expect(toCalendarDate(new Date(input)).toISOString()).toBe(utcMidnight)
  })
})

describe('atReykjavik', () => {
  it('reports the UTC wall clock whatever the process timezone is', () => {
    const shifted = atReykjavik(new Date('2026-05-06T00:00:00.000Z'))

    expect(shifted.getFullYear()).toBe(2026)
    expect(shifted.getMonth()).toBe(4)
    expect(shifted.getDate()).toBe(6)
    expect(shifted.getHours()).toBe(0)
  })

  /**
   * Offset arithmetic reads getTimezoneOffset() at the original instant while
   * the formatter applies the offset at the shifted one. Across a year that
   * cost a whole calendar day six times in Auckland, three in Santiago and
   * three in Lord Howe.
   */
  it('keeps the calendar day across every instant of a year', () => {
    const step = 20 * 60 * 1000
    const end = Date.UTC(2027, 0, 1)
    const wrong: string[] = []

    for (let t = Date.UTC(2026, 0, 1); t < end; t += step) {
      const instant = new Date(t)
      const shifted = atReykjavik(instant)

      if (
        shifted.getDate() !== instant.getUTCDate() ||
        shifted.getMonth() !== instant.getUTCMonth() ||
        shifted.getFullYear() !== instant.getUTCFullYear()
      ) {
        wrong.push(instant.toISOString())
      }
    }

    expect(wrong).toEqual([])
  })
})

describe('toCalendarDateIso / fromCalendarDateIso', () => {
  it('sends the day the user saw, not the instant their clock was at', () => {
    // what react-datepicker hands back for "6. maí", in local time
    const picked = new Date(2026, 4, 6)

    expect(toCalendarDateIso(picked)).toBe('2026-05-06T00:00:00.000Z')
  })

  it('round-trips a stored calendar day back to the same local day', () => {
    const seeded = fromCalendarDateIso('2026-05-06T00:00:00.000Z')

    expect(seeded.getFullYear()).toBe(2026)
    expect(seeded.getMonth()).toBe(4)
    expect(seeded.getDate()).toBe(6)
    expect(toCalendarDateIso(seeded)).toBe('2026-05-06T00:00:00.000Z')
  })
})

describe('toCalendarDateIso', () => {
  it('returns the empty value rather than throwing on an unparseable date', () => {
    expect(toCalendarDateIso(new Date('nope'))).toBe('')
  })
})

describe('toReykjavikDateTimeIso / fromReykjavikDateTimeIso', () => {
  /**
   * Reported by a lawyer who filed from abroad: he entered a skiptafundur time
   * and the published advert named a different one, his time converted to
   * Icelandic. The field asks for a clock face, so send the clock face.
   */
  it('sends the clock face the user typed, not the instant their computer was at', () => {
    // what react-datepicker hands back for "6. maí, kl. 14:00", in local time
    const picked = new Date(2026, 4, 6, 14, 0)

    expect(toReykjavikDateTimeIso(picked)).toBe('2026-05-06T14:00:00.000Z')
  })

  it('round-trips a stored time back to the same clock face', () => {
    const seeded = fromReykjavikDateTimeIso('2026-05-06T14:00:00.000Z')

    expect(seeded.getHours()).toBe(14)
    expect(seeded.getMinutes()).toBe(0)
    expect(seeded.getDate()).toBe(6)
    expect(toReykjavikDateTimeIso(seeded)).toBe('2026-05-06T14:00:00.000Z')
  })

  it('keeps the time of day that a calendar-day field would discard', () => {
    const picked = new Date(2026, 4, 6, 14, 30)

    expect(toCalendarDateIso(picked)).toBe('2026-05-06T00:00:00.000Z')
    expect(toReykjavikDateTimeIso(picked)).toBe('2026-05-06T14:30:00.000Z')
  })

  it('returns the empty value rather than throwing on an unparseable date', () => {
    expect(toReykjavikDateTimeIso(new Date('nope'))).toBe('')
  })
})
