import { GenderEnum } from '../../report/models/report.enums'
import { ScatterDataPointDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import { buildSalaryChartSvg } from './salary-chart-svg'

const points: ScatterDataPointDto[] = [
  { score: 100, regularHourlyWage: 2902, gender: GenderEnum.MALE },
  { score: 450, regularHourlyWage: 4884, gender: GenderEnum.FEMALE },
  { score: 750, regularHourlyWage: 14550, gender: GenderEnum.MALE },
]

/**
 * ⚠️ **Log-space coefficients.** These were level-space (`slope: 16.14`,
 * `intercept: -3358.43`) while this renderer drew `statistics.regressionLine`.
 * It now draws `pooledFit`, the fit every figure in the úrbótaáætlun table is
 * derived from — so the coefficients are `log(kr./klst.)` per stig, and feeding
 * the old ones in would overflow `exp()` rather than fail visibly.
 *
 * Fitted from the three points above: 100 stig → 2.608, 450 → 6.155,
 * 750 → 12.847 kr./klst.
 */
const FIT = { slope: 0.002453, intercept: 7.6211 }

/** The fitted line, whose stroke width distinguishes it from the gridlines. */
const CURVE = 'stroke-width="2.5"'

describe('buildSalaryChartSvg', () => {
  it('produces a single well-formed svg element', () => {
    const svg = buildSalaryChartSvg(points, FIT)

    expect(svg.trim().startsWith('<svg')).toBe(true)
    expect(svg.trim().endsWith('</svg>')).toBe(true)
    // One circle per data point.
    expect((svg.match(/<circle[^>]*r="4"/g) ?? []).length).toBe(points.length)
  })

  it('colors points by gender (blue male, purple female)', () => {
    const svg = buildSalaryChartSvg(points, FIT)

    expect(svg).toContain('fill="#0061ff"') // male
    expect(svg).toContain('fill="#6a2ea0"') // female
  })

  /**
   * ⚠️ A polyline, not a `<line>`, and that is the point of this change.
   *
   * `exp(a + b·stig)` is a curve in krónur, so two endpoints cannot describe it.
   * The renderer drew a straight level-space line until now while the table on
   * the same page printed log-fit figures — a reader could see a point above the
   * drawn line whose row said the employee was underpaid.
   */
  it('draws the fitted line as a sampled curve, not a two-point segment', () => {
    const svg = buildSalaryChartSvg(points, FIT)

    expect(svg).toContain('stroke="#9a0074"')
    expect(svg).toContain('clip-path="url(#plot-clip)"')
    expect(svg).toContain('<polyline')

    const polyline = /<polyline points="([^"]+)"/.exec(svg)?.[1] ?? ''
    // 49 samples across the observed range — enough that the curvature is
    // visible rather than implied.
    expect(polyline.split(' ')).toHaveLength(49)
  })

  /**
   * The curve must actually bend. A straight chord between the endpoints would
   * pass every other assertion here, so this is the one that would fail if the
   * renderer ever went back to a level-space line.
   */
  it('bends: the midpoint sits below the chord between the endpoints', () => {
    const svg = buildSalaryChartSvg(points, FIT)
    const polyline = /<polyline points="([^"]+)"/.exec(svg)?.[1] ?? ''
    const ys = polyline.split(' ').map((pair) => Number(pair.split(',')[1]))

    // SVG y grows downward, so a convex curve in krónur sits BELOW the chord in
    // value terms, i.e. at a LARGER y than the chord's midpoint.
    const chordMidY = (ys[0] + ys[ys.length - 1]) / 2
    expect(ys[Math.floor(ys.length / 2)]).toBeGreaterThan(chordMidY)
  })

  /**
   * The curve is folded into the y-domain. The old renderer scaled y from the
   * data points alone, so a steep fit reached the plot edge and was silently
   * clipped.
   */
  it('scales the y-axis to the data rather than a fixed 100.000 step', () => {
    const svg = buildSalaryChartSvg(points, FIT)

    // Max 14.550 → a 15.000 axis, quartered into whole krónur. The curve tops
    // out at 12.847, below the data, so the data still sets the scale here.
    expect(svg).toContain('>15.000<')
    expect(svg).toContain('>3.750<')
    expect(svg).not.toContain('>100.000<')
  })

  it('raises the y-axis when the curve tops the observed wages', () => {
    // Same points, a steeper fit: 750 stig → 19.363 kr./klst., above the highest
    // observed wage of 14.550. Scaling from the data alone would give a 15.000
    // axis and clip the top of the curve at the plot edge, which is exactly what
    // the previous renderer did.
    const svg = buildSalaryChartSvg(points, {
      slope: 0.003,
      intercept: 7.6211,
    })

    // Discriminated on the QUARTER tick, not the top one: a 20.000 axis is
    // quartered 0 / 5.000 / 10.000 / 15.000, so "15.000" appears either way.
    // 3.750 is a tick only on the 15.000 axis the data alone would have given.
    expect(svg).toContain('>20.000<')
    expect(svg).not.toContain('>3.750<')
  })

  /**
   * A null fit draws nothing. It used to be coerced to slope 0, giving a flat
   * line that reads as "pay does not rise with score at all" — a finding rather
   * than a gap in the data.
   */
  it('draws no fitted line when the fit is null', () => {
    const svg = buildSalaryChartSvg(points, { slope: null, intercept: null })

    expect(svg).toContain('<circle')
    expect(svg).not.toContain('<polyline')
  })

  it('draws nothing for a missing fit either', () => {
    expect(buildSalaryChartSvg(points, null)).not.toContain('<polyline')
    expect(buildSalaryChartSvg(points)).not.toContain('<polyline')
  })

  // ...but slope 0 is a REAL degenerate fit (every score identical), not absent
  // data, so it must still draw — flat, at exp(intercept).
  it('still draws a flat line for a genuine zero slope', () => {
    const svg = buildSalaryChartSvg(points, {
      slope: 0,
      intercept: Math.log(5000),
    })

    expect(svg).toContain(CURVE)
    const polyline = /<polyline points="([^"]+)"/.exec(svg)?.[1] ?? ''
    const ys = polyline.split(' ').map((pair) => Number(pair.split(',')[1]))
    expect(new Set(ys.map((y) => y.toFixed(6))).size).toBe(1)
  })

  it('labels the y-axis in kr./klst., not kr.', () => {
    const svg = buildSalaryChartSvg(points, FIT)

    expect(svg).toContain('>kr./klst.<')
  })

  it('does not throw on an empty dataset', () => {
    expect(() => buildSalaryChartSvg([], FIT)).not.toThrow()
  })
})
