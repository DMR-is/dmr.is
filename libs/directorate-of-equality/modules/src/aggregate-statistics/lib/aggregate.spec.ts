import {
  coversMonth,
  MINIMUM_COHORT,
  monthsBetween,
  pointsToFraction,
  shareOf,
  suppressedMean,
  timeHeader,
} from './aggregate'

describe('suppressedMean', () => {
  const five = [1, 2, 3, 4, 5]

  it('withholds a mean over too small a cohort', () => {
    // The whole point of the rule: a pay gap averaged over two companies is
    // close to publishing each of them.
    expect(suppressedMean([10, 12])).toBeNull()
    expect(suppressedMean(five.slice(0, MINIMUM_COHORT - 1))).toBeNull()
  })

  it('publishes at exactly the threshold', () => {
    expect(suppressedMean(five)).toBe(3)
  })

  it('returns null for an empty cohort, never 0', () => {
    // `0` would read as "no pay gap", which is the opposite claim from "we may
    // not say". The contract makes `value` nullable for exactly this.
    expect(suppressedMean([])).toBeNull()
  })

  it('does not treat a genuine zero mean as absent', () => {
    expect(suppressedMean([0, 0, 0, 0, 0])).toBe(0)
  })

  it('rounds to two decimals', () => {
    expect(suppressedMean([1, 1, 1, 1, 1.004])).toBe(1)
    expect(suppressedMean([3.456, 3.456, 3.456, 3.456, 3.456])).toBe(3.46)
  })
})

describe('shareOf', () => {
  it('returns null rather than dividing by zero', () => {
    // An empty denominator means "nothing was obliged", which is not 0%.
    expect(shareOf(0, 0)).toBeNull()
  })

  it('returns a fraction, not percent points', () => {
    expect(shareOf(1, 3)).toBe(0.333)
    expect(shareOf(3, 3)).toBe(1)
  })

  it('keeps a real zero', () => {
    expect(shareOf(0, 10)).toBe(0)
  })
})

describe('pointsToFraction', () => {
  it('converts percent points to a fraction without losing precision', () => {
    expect(pointsToFraction(4.25)).toBe(0.0425)
    expect(pointsToFraction(1.1)).toBe(0.011)
  })

  it('keeps a suppressed value suppressed', () => {
    expect(pointsToFraction(null)).toBeNull()
  })
})

describe('monthsBetween', () => {
  it('includes both ends', () => {
    const months = monthsBetween(
      new Date('2026-01-15T00:00:00Z'),
      new Date('2026-03-02T00:00:00Z'),
    )

    expect(months.map((m) => m.toISOString())).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-02-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z',
    ])
  })

  it('emits a single month when both ends fall in it', () => {
    expect(
      monthsBetween(
        new Date('2026-05-02T00:00:00Z'),
        new Date('2026-05-29T00:00:00Z'),
      ),
    ).toHaveLength(1)
  })

  it('crosses a year boundary', () => {
    const months = monthsBetween(
      new Date('2025-11-01T00:00:00Z'),
      new Date('2026-02-01T00:00:00Z'),
    )

    expect(months).toHaveLength(4)
  })
})

describe('coversMonth', () => {
  const march = new Date(Date.UTC(2026, 2, 1))

  it('covers a month inside the validity interval', () => {
    // Coverage is an interval, not an event — a report approved years earlier
    // still covers this month if it has not expired.
    expect(
      coversMonth(
        {
          approvedAt: new Date('2024-03-10T00:00:00Z'),
          validUntil: new Date('2027-03-10T00:00:00Z'),
        },
        march,
      ),
    ).toBe(true)
  })

  it('does not cover a month before it was approved', () => {
    expect(
      coversMonth(
        {
          approvedAt: new Date('2026-04-01T00:00:00Z'),
          validUntil: new Date('2029-04-01T00:00:00Z'),
        },
        march,
      ),
    ).toBe(false)
  })

  it('covers the month it was approved in, even late in the month', () => {
    expect(
      coversMonth(
        {
          approvedAt: new Date('2026-03-31T23:00:00Z'),
          validUntil: null,
        },
        march,
      ),
    ).toBe(true)
  })

  it('does not cover a month after it expired', () => {
    expect(
      coversMonth(
        {
          approvedAt: new Date('2020-01-01T00:00:00Z'),
          validUntil: new Date('2026-02-28T00:00:00Z'),
        },
        march,
      ),
    ).toBe(false)
  })

  it('treats a missing validUntil as still in force', () => {
    expect(
      coversMonth(
        { approvedAt: new Date('2024-01-01T00:00:00Z'), validUntil: null },
        march,
      ),
    ).toBe(true)
  })

  it('never counts an unapproved report', () => {
    expect(coversMonth({ approvedAt: null, validUntil: null }, march)).toBe(
      false,
    )
  })
})

describe('timeHeader', () => {
  it('is ms-epoch as a string, matching the chart pipeline', () => {
    expect(timeHeader(new Date('2026-03-01T00:00:00Z'))).toBe('1772323200000')
  })
})
