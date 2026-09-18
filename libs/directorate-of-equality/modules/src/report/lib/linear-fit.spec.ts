import { fitLinear, type LinearFitSample } from './linear-fit'

/** Narrows a nullable fit field, failing the test rather than asserting `!`. */
function assertFitted(value: number | null): asserts value is number {
  if (value === null) {
    throw new Error('expected a fitted number, got null')
  }
}

describe('linear-fit', () => {
  it('returns an all-null fit for an empty sample, with xSumSquares 0', () => {
    const fit = fitLinear([])

    expect(fit).toEqual({
      slope: null,
      intercept: null,
      sampleCount: 0,
      xMean: null,
      yMean: null,
      xSumSquares: 0,
      rSquared: null,
      xRangeFrom: null,
      xRangeTo: null,
    })
  })

  it('recovers an exact line', () => {
    // y = 8x + 2000 — the shape of the outlier line on hourly wages.
    const samples = [5, 10, 15, 20].map((x) => ({ x, y: 8 * x + 2000 }))

    const fit = fitLinear(samples)

    expect(fit.slope).toBeCloseTo(8, 10)
    expect(fit.intercept).toBeCloseTo(2000, 10)
    expect(fit.rSquared).toBeCloseTo(1, 10)
    expect(fit.sampleCount).toBe(4)
    expect(fit.xMean).toBeCloseTo(12.5, 10)
    expect(fit.xRangeFrom).toBe(5)
    expect(fit.xRangeTo).toBe(20)
    expect(fit.xSumSquares).toBeGreaterThan(0)
  })

  describe('the identity every decomposition claim rests on', () => {
    const cases: Array<{ name: string; samples: LinearFitSample[] }> = [
      {
        name: 'noisy sample',
        samples: [
          { x: 3, y: 2400 },
          { x: 7, y: 2610 },
          { x: 11, y: 3380 },
          { x: 14, y: 3120 },
          { x: 19, y: 4400 },
        ],
      },
      {
        name: 'log-scale y (the wage-gap fit)',
        samples: [
          { x: 3, y: Math.log(2400) },
          { x: 7, y: Math.log(2610) },
          { x: 11, y: Math.log(3380) },
          { x: 14, y: Math.log(3120) },
          { x: 19, y: Math.log(4400) },
        ],
      },
      { name: 'single sample', samples: [{ x: 4, y: 9 }] },
    ]

    it.each(cases)(
      'intercept + slope·xMean === yMean ($name)',
      ({ samples }) => {
        const { slope, intercept, xMean, yMean } = fitLinear(samples)
        assertFitted(slope)
        assertFitted(intercept)
        assertFitted(xMean)
        assertFitted(yMean)

        expect(intercept + slope * xMean).toBeCloseTo(yMean, 10)
      },
    )

    // Why per-employee contributions sum exactly to the unexplained gap.
    it.each(cases)('residuals sum to zero ($name)', ({ samples }) => {
      const { slope, intercept } = fitLinear(samples)
      assertFitted(slope)
      assertFitted(intercept)

      const residualSum = samples.reduce(
        (total, s) => total + (s.y - (slope * s.x + intercept)),
        0,
      )

      expect(Math.abs(residualSum)).toBeLessThan(1e-9)
    })
  })

  describe('degenerate inputs', () => {
    // ⚠️ The trap `xSumSquares` exists to close: an unidentifiable slope is
    // reported as 0, not null, so `slope !== null` is NOT a validity test.
    it('reports slope 0 — not null — when x has no variation, and flags it via xSumSquares', () => {
      const fit = fitLinear([
        { x: 12, y: 2400 },
        { x: 12, y: 3100 },
        { x: 12, y: 2750 },
      ])

      expect(fit.slope).toBe(0)
      expect(fit.slope).not.toBeNull()
      expect(fit.xSumSquares).toBe(0)
      expect(fit.intercept).toBeCloseTo(2750, 10)
      expect(fit.yMean).toBeCloseTo(2750, 10)
      expect(fit.rSquared).toBeNull()
      expect(fit.sampleCount).toBe(3)
    })

    // Same slope, same null r² — but identifiable. Only xSumSquares separates
    // this from the case above.
    it('distinguishes "no y variation" from "no x variation" by xSumSquares alone', () => {
      const flatY = fitLinear([
        { x: 3, y: 2750 },
        { x: 9, y: 2750 },
        { x: 15, y: 2750 },
      ])

      expect(flatY.slope).toBe(0)
      expect(flatY.rSquared).toBeNull()
      expect(flatY.xSumSquares).toBeGreaterThan(0)
    })

    it('handles a single sample: no slope to identify, line through the point', () => {
      const fit = fitLinear([{ x: 7, y: 3000 }])

      expect(fit.slope).toBe(0)
      expect(fit.xSumSquares).toBe(0)
      expect(fit.intercept).toBe(3000)
      expect(fit.xRangeFrom).toBe(7)
      expect(fit.xRangeTo).toBe(7)
    })
  })

  it('is unit-neutral: scaling y scales slope and intercept, leaving r² intact', () => {
    const samples = [
      { x: 3, y: 2400 },
      { x: 7, y: 2610 },
      { x: 11, y: 3380 },
      { x: 19, y: 4400 },
    ]

    const fit = fitLinear(samples)
    const scaled = fitLinear(samples.map((s) => ({ x: s.x, y: s.y / 1000 })))
    assertFitted(fit.slope)
    assertFitted(fit.intercept)
    assertFitted(fit.rSquared)

    expect(scaled.slope).toBeCloseTo(fit.slope / 1000, 12)
    expect(scaled.intercept).toBeCloseTo(fit.intercept / 1000, 12)
    expect(scaled.rSquared).toBeCloseTo(fit.rSquared, 12)
    expect(scaled.xSumSquares).toBeCloseTo(fit.xSumSquares, 12)
  })
})
