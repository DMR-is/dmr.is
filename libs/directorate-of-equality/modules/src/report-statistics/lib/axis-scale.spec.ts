import { niceAxisMax } from './axis-scale'

describe('niceAxisMax', () => {
  // The regression this exists to prevent: a fixed 100.000 step put every
  // observed hourly wage in the bottom 5% of a single band.
  it('keeps hourly wages filling most of the plot', () => {
    expect(niceAxisMax(4900)).toBe(5000)
    expect(niceAxisMax(14550)).toBe(15000)
    expect(niceAxisMax(2902)).toBe(3000)
  })

  it('still scales sensibly for monthly-magnitude values', () => {
    expect(niceAxisMax(650000)).toBe(750000)
    expect(niceAxisMax(1065400)).toBe(1500000)
  })

  it.each([4900, 14550, 2902, 650000, 33])(
    'never crops the data (%p)',
    (dataMax) => {
      expect(niceAxisMax(dataMax)).toBeGreaterThanOrEqual(dataMax)
    },
  )

  it.each([4900, 14550, 650000])(
    'leaves the data filling at least 80%% of the axis (%p)',
    (dataMax) => {
      expect(dataMax / niceAxisMax(dataMax)).toBeGreaterThan(0.8)
    },
  )

  // Five ticks are drawn at 0/¼/½/¾/max, so the max must quarter cleanly enough
  // to avoid labels like 3.637,5.
  it.each([4900, 14550, 2902, 650000])(
    'quarters into whole krónur (%p)',
    (dataMax) => {
      expect(niceAxisMax(dataMax) / 4).toBe(
        Math.round(niceAxisMax(dataMax) / 4),
      )
    },
  )

  it('handles degenerate input without producing a zero-height axis', () => {
    expect(niceAxisMax(0)).toBe(1)
    expect(niceAxisMax(-5)).toBe(1)
    expect(niceAxisMax(Number.NaN)).toBe(1)
    expect(niceAxisMax(Number.POSITIVE_INFINITY)).toBe(1)
  })
})
