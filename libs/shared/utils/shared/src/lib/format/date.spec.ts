import { formatDateInIceland } from './date'

/**
 * Iceland observes GMT all year, so the correct rendering of any instant is
 * simply its UTC fields. These expectations are absolute rather than computed:
 * they must hold whatever zone the test process runs in.
 *
 * Run the suite under several zones, not just UTC. A UTC-only run passes even
 * when the implementation leaks the runtime's zone, which is exactly how an
 * earlier version of this helper shipped a DST bug:
 *
 *   TZ=UTC / TZ=Europe/Berlin / TZ=America/Los_Angeles / TZ=Australia/Lord_Howe
 */
const CASES: Array<[string, string, string]> = [
  // Ordinary instant, late enough that a positive-offset zone rolls the date.
  ['2026-01-15T23:30:00.000Z', '15.01.26 kl. 23:30', '15.01.2026'],

  // Europe/Berlin springs forward 2026-03-29 01:00Z. Both of these sit on the
  // far side of that transition from the instant an offset shift would sample,
  // and the second lands inside the hour that does not exist in Berlin.
  ['2026-03-29T01:30:00.000Z', '29.03.26 kl. 01:30', '29.03.2026'],
  ['2026-03-29T02:30:00.000Z', '29.03.26 kl. 02:30', '29.03.2026'],

  // Berlin falls back 2026-10-25 01:00Z — the same trap in the other direction,
  // where the local hour is ambiguous rather than missing.
  ['2026-10-25T01:30:00.000Z', '25.10.26 kl. 01:30', '25.10.2026'],

  // Midnight boundary: any negative-offset zone is still on the previous day.
  ['2026-06-01T00:15:00.000Z', '1.06.26 kl. 00:15', '01.06.2026'],

  // Lord Howe shifts by 30 minutes, which a whole-hour assumption would miss.
  ['2026-04-05T15:45:00.000Z', '5.04.26 kl. 15:45', '05.04.2026'],
]

describe('formatDateInIceland', () => {
  it.each(CASES)(
    'renders %s as the Icelandic wall clock',
    (instant, expectedDateTime, expectedDate) => {
      expect(formatDateInIceland(instant, "d.MM.yy 'kl.' HH:mm")).toBe(
        expectedDateTime,
      )
      expect(formatDateInIceland(instant, 'dd.MM.yyyy')).toBe(expectedDate)
    },
  )

  it('renders a time-only format from the UTC fields', () => {
    expect(formatDateInIceland('2026-03-29T02:30:00.000Z', 'HH:mm')).toBe(
      '02:30',
    )
  })

  it('renders Icelandic month names against the Icelandic calendar day', () => {
    // 23:40Z on the 31st is already 1 June for a positive-offset viewer, so a
    // leaked zone would name the wrong month as well as the wrong day.
    expect(
      formatDateInIceland('2026-05-31T23:40:00.000Z', 'dd. MMMM yyyy'),
    ).toBe('31. maí 2026')
  })

  it('accepts a Date as well as a string', () => {
    expect(
      formatDateInIceland(new Date('2026-03-29T02:30:00.000Z'), 'HH:mm'),
    ).toBe('02:30')
  })

  it('rejects an invalid date rather than rendering one', () => {
    expect(() => formatDateInIceland('not a date')).toThrow('Invalid date')
  })
})
