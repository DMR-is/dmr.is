/**
 * Unit-neutral ordinary-least-squares fit of `y` on a single `x`.
 *
 * Deliberately says nothing about salaries, scores or currency: the same
 * routine fits
 *
 * - **kr./klst. on starfsmatsstig** — the outlier line, and
 * - **log(kr./klst.) on starfsmatsstig** — the wage-gap decomposition,
 *
 * and a snapshot type naming one of those would lie about the other. (The
 * previous salary-specific version reported `adjustedBaseSalaryMean: -8.34`
 * when handed log wages, which is how this extraction came about.)
 *
 * ## The identity everything downstream rests on
 *
 * OLS with an intercept satisfies
 *
 * ```
 * intercept + slope · xMean === yMean
 * ```
 *
 * exactly in exact arithmetic, and to floating-point rounding here (`intercept`
 * is *defined* as `yMean − slope · xMean`). The Oaxaca-Blinder identity
 * `skýrt + óskýrt = Δ` is a consequence of it and holds for **any** reference
 * coefficient vector — which is what makes it a real invariant to assert
 * against, rather than a tautology of the fitting procedure.
 *
 * A second consequence, used by the decomposition: because OLS residuals sum to
 * zero, per-employee contributions to the unexplained gap sum *exactly* to that
 * gap.
 *
 * ## Why `xSumSquares` is on the result
 *
 * `Σ(xᵢ − x̄)²` is the honest test of whether a slope is identifiable at all.
 * ⚠️ **Do not test `slope !== null` for that.** When every `x` is identical this
 * function returns `slope: 0` — not `null` — because a flat line through the
 * mean is the right answer for prediction. But 0 is also a perfectly ordinary
 * fitted slope, so the two cases are indistinguishable from the slope alone. A
 * caller that needs "is there anything to explain with?" must read
 * `xSumSquares <= 0`.
 *
 * It doubles as the precision weight for a within-group (Fortin) pooled
 * reference, should that variant ever be selected over Neumark.
 */

export type LinearFitSample = {
  x: number
  y: number
}

export type LinearFit = {
  /** `null` only for an empty sample. `0` when `x` has no variation. */
  slope: number | null
  intercept: number | null
  sampleCount: number
  xMean: number | null
  yMean: number | null
  /** `Σ(xᵢ − x̄)²`. `0` ⇒ slope not identifiable. Never null: an empty sum is 0. */
  xSumSquares: number
  /** `null` when `y` has no variation (nothing for the line to explain). */
  rSquared: number | null
  xRangeFrom: number | null
  xRangeTo: number | null
}

const EMPTY_FIT: LinearFit = {
  slope: null,
  intercept: null,
  sampleCount: 0,
  xMean: null,
  yMean: null,
  xSumSquares: 0,
  rSquared: null,
  xRangeFrom: null,
  xRangeTo: null,
}

export function fitLinear(samples: LinearFitSample[]): LinearFit {
  if (samples.length === 0) {
    return { ...EMPTY_FIT }
  }

  let sumX = 0
  let sumY = 0
  let xMin = samples[0].x
  let xMax = samples[0].x
  for (const sample of samples) {
    sumX += sample.x
    sumY += sample.y
    if (sample.x < xMin) xMin = sample.x
    if (sample.x > xMax) xMax = sample.x
  }

  const xMean = sumX / samples.length
  const yMean = sumY / samples.length

  let xSumSquares = 0
  let crossProducts = 0
  let ySumSquares = 0
  for (const sample of samples) {
    const dx = sample.x - xMean
    const dy = sample.y - yMean
    xSumSquares += dx * dx
    crossProducts += dx * dy
    ySumSquares += dy * dy
  }

  // No variation in x ⇒ no slope is identifiable. Return the flat line through
  // ȳ, which predicts correctly for every observed x (there is only one). r² is
  // null rather than 0: the line explains nothing, but there was also nothing
  // it could have explained.
  if (xSumSquares === 0) {
    return {
      slope: 0,
      intercept: yMean,
      sampleCount: samples.length,
      xMean,
      yMean,
      xSumSquares: 0,
      rSquared: null,
      xRangeFrom: xMin,
      xRangeTo: xMax,
    }
  }

  const slope = crossProducts / xSumSquares
  const intercept = yMean - slope * xMean

  let residualSquares = 0
  for (const sample of samples) {
    const residual = sample.y - (slope * sample.x + intercept)
    residualSquares += residual * residual
  }

  return {
    slope,
    intercept,
    sampleCount: samples.length,
    xMean,
    yMean,
    xSumSquares,
    rSquared: ySumSquares === 0 ? null : 1 - residualSquares / ySumSquares,
    xRangeFrom: xMin,
    xRangeTo: xMax,
  }
}
