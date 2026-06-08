import { GenderEnum } from '../../report/models/report.enums'
import { ScatterDataPointDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import { buildSalaryChartSvg } from './salary-chart-svg'

const points: ScatterDataPointDto[] = [
  { score: 100, adjustedSalary: 600000, gender: GenderEnum.MALE },
  { score: 450, adjustedSalary: 1200000, gender: GenderEnum.FEMALE },
  { score: 750, adjustedSalary: 2000000, gender: GenderEnum.MALE },
]

describe('buildSalaryChartSvg', () => {
  it('produces a single well-formed svg element', () => {
    const svg = buildSalaryChartSvg(points, { slope: 1500, intercept: 500000 })

    expect(svg.trim().startsWith('<svg')).toBe(true)
    expect(svg.trim().endsWith('</svg>')).toBe(true)
    // One circle per data point.
    expect((svg.match(/<circle[^>]*r="4"/g) ?? []).length).toBe(points.length)
  })

  it('colors points by gender (blue male, purple female)', () => {
    const svg = buildSalaryChartSvg(points, { slope: 1500, intercept: 500000 })

    expect(svg).toContain('fill="#0061ff"') // male
    expect(svg).toContain('fill="#6a2ea0"') // female
  })

  it('draws the regression line in the rose tint', () => {
    const svg = buildSalaryChartSvg(points, { slope: 1500, intercept: 500000 })

    expect(svg).toContain('stroke="#9a0074"')
    expect(svg).toContain('clip-path="url(#plot-clip)"')
  })

  it('does not throw on an empty dataset', () => {
    expect(() =>
      buildSalaryChartSvg([], { slope: 0, intercept: 0 }),
    ).not.toThrow()
  })
})
