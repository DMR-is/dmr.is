import { GenderEnum } from '../../report/models/report.enums'
import { ScatterDataPointDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import { buildSalaryChartSvg } from './salary-chart-svg'

const points: ScatterDataPointDto[] = [
  { score: 100, regularHourlyWage: 2902, gender: GenderEnum.MALE },
  { score: 450, regularHourlyWage: 4884, gender: GenderEnum.FEMALE },
  { score: 750, regularHourlyWage: 14550, gender: GenderEnum.MALE },
]

describe('buildSalaryChartSvg', () => {
  it('produces a single well-formed svg element', () => {
    const svg = buildSalaryChartSvg(points, {
      slope: 16.14,
      intercept: -3358.43,
      rSquared: 1,
    })

    expect(svg.trim().startsWith('<svg')).toBe(true)
    expect(svg.trim().endsWith('</svg>')).toBe(true)
    // One circle per data point.
    expect((svg.match(/<circle[^>]*r="4"/g) ?? []).length).toBe(points.length)
  })

  it('colors points by gender (blue male, purple female)', () => {
    const svg = buildSalaryChartSvg(points, {
      slope: 16.14,
      intercept: -3358.43,
      rSquared: 1,
    })

    expect(svg).toContain('fill="#0061ff"') // male
    expect(svg).toContain('fill="#6a2ea0"') // female
  })

  it('draws the regression line in the rose tint', () => {
    const svg = buildSalaryChartSvg(points, {
      slope: 16.14,
      intercept: -3358.43,
      rSquared: 1,
    })

    expect(svg).toContain('stroke="#9a0074"')
    expect(svg).toContain('clip-path="url(#plot-clip)"')
  })

  // ⚠️ Regression guard. The axis used to round up to the nearest 100.000,
  // which on hourly wages left every point in the bottom ~5% of one band with
  // ticks reading 0 / 25.000 / … / 100.000. Nothing in this file caught that,
  // because none of the assertions above look at the scale.
  it('scales the y-axis to the data rather than a fixed 100.000 step', () => {
    const svg = buildSalaryChartSvg(points, {
      slope: 16.14,
      intercept: -3358.43,
      rSquared: 1,
    })

    // Max 14.550 → a 15.000 axis, quartered into whole krónur.
    expect(svg).toContain('>15.000<')
    expect(svg).toContain('>3.750<')
    expect(svg).not.toContain('>100.000<')
  })

  // The branch that exists because these figures are now PRINTED beside the
  // chart: a null fit used to be coerced to slope 0, drawing a flat line that
  // reads as "pay does not rise with score at all" — a finding, not a gap in the
  // data. No line is the honest rendering.
  it('draws no regression line when the fit is null', () => {
    const svg = buildSalaryChartSvg(points, {
      slope: null,
      intercept: null,
      rSquared: null,
    })

    // Scatter still renders; only the fitted line is withheld.
    expect(svg).toContain('<circle')
    expect(svg).not.toContain('stroke-width="2.5" clip-path="url(#plot-clip)"')
  })

  // ...but slope 0 is a REAL degenerate fit (every score identical), not absent
  // data, so it must still draw.
  it('still draws a flat line for a genuine zero slope', () => {
    const svg = buildSalaryChartSvg(points, {
      slope: 0,
      intercept: 5000,
      rSquared: 0,
    })

    expect(svg).toContain('stroke-width="2.5" clip-path="url(#plot-clip)"')
  })

  it('labels the y-axis in kr./klst., not kr.', () => {
    const svg = buildSalaryChartSvg(points, {
      slope: 16.14,
      intercept: -3358.43,
      rSquared: 1,
    })

    expect(svg).toContain('>kr./klst.<')
  })

  it('does not throw on an empty dataset', () => {
    expect(() =>
      buildSalaryChartSvg([], { slope: 0, intercept: 0, rSquared: 1 }),
    ).not.toThrow()
  })
})
