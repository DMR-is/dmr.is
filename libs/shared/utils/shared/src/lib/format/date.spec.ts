import { formatDateInIceland } from './date'

/**
 * 23:30 UTC — late enough that a positive-offset zone rolls over to the next
 * day, so a timezone leak shows up in the date as well as the time. Rendered in
 * Iceland (GMT, no DST) this instant is always 15.01.26 kl. 23:30.
 *
 * These expectations are deliberately absolute rather than computed: they must
 * hold whatever zone the test process runs in. Run the suite under
 * `TZ=Europe/Berlin` as well as `TZ=UTC` — plain `formatDate` renders
 * `16.01.26 kl. 00:30` under Berlin, and that difference is the hydration
 * mismatch this variant exists to remove.
 */
const INSTANT = '2026-01-15T23:30:00.000Z'

describe('formatDateInIceland', () => {
  it('renders the Icelandic wall clock regardless of the runtime zone', () => {
    expect(formatDateInIceland(INSTANT, "d.MM.yy 'kl.' HH:mm")).toBe(
      '15.01.26 kl. 23:30',
    )
  })

  it('does not let a positive-offset zone roll the date forward', () => {
    expect(formatDateInIceland(INSTANT, 'dd.MM.yyyy')).toBe('15.01.2026')
  })

  it('accepts a Date as well as a string', () => {
    expect(formatDateInIceland(new Date(INSTANT), 'HH:mm')).toBe('23:30')
  })

  it('rejects an invalid date rather than rendering one', () => {
    expect(() => formatDateInIceland('not a date')).toThrow('Invalid date')
  })
})
