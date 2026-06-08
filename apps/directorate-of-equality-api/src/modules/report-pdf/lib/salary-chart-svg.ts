import { GenderEnum } from '../../report/models/report.enums'
import {
  RegressionLineDto,
  ScatterDataPointDto,
} from '../../report-statistics/dto/salary-by-gender-and-score.dto'

/**
 * Colors mirror the admin `SalaryDistributionChart` (island-ui theme):
 * blue400 male points, purple400 female points, yellow400 neutral points and
 * the roseTinted400 regression ("Meðallaun") line.
 */
const COLORS = {
  male: '#0061ff',
  female: '#6a2ea0',
  neutral: '#fff066',
  regression: '#9a0074',
  grid: '#ccdfff',
  axis: '#00003c',
  text: '#00003c',
}

const WIDTH = 720
const HEIGHT = 440
const MARGIN = { top: 24, right: 24, bottom: 72, left: 96 }
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom

/** is-IS thousands formatting with a dot separator, matching the admin chart. */
function formatSalary(value: number): string {
  return new Intl.NumberFormat('is-IS')
    .format(Math.round(value))
    .replaceAll(',', '.')
}

function pointColor(gender: GenderEnum): string {
  if (gender === GenderEnum.MALE) return COLORS.male
  if (gender === GenderEnum.FEMALE) return COLORS.female
  return COLORS.neutral
}

/**
 * Renders the salary-by-score scatter plot (with linear regression line) as a
 * standalone inline `<svg>` string for embedding in the PDF HTML. Pure — takes
 * the already-computed chart payload from `IReportStatisticsService`.
 *
 * Mirrors the axis/scaling logic of the admin Recharts component:
 * y rounded up to the nearest 100k, x to the nearest 250.
 */
export function buildSalaryChartSvg(
  dataPoints: ScatterDataPointDto[],
  regressionLine: RegressionLineDto,
): string {
  const yValues = dataPoints.map((p) => p.adjustedSalary)
  const yMax = Math.ceil(Math.max(...yValues, 1) / 100_000) * 100_000
  const xMax =
    Math.ceil((Math.max(...dataPoints.map((p) => p.score), 1) + 100) / 250) *
    250

  const xScale = (score: number) => MARGIN.left + (score / xMax) * PLOT_W
  const yScale = (salary: number) =>
    MARGIN.top + PLOT_H - (salary / yMax) * PLOT_H

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f))
  const xTickCount = Math.ceil(xMax / 250)
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => i * 250)

  // Horizontal gridlines + y-axis tick labels.
  const gridAndYLabels = yTicks
    .map((tick) => {
      const y = yScale(tick)
      return `
        <line x1="${MARGIN.left}" y1="${y}" x2="${MARGIN.left + PLOT_W}" y2="${y}" stroke="${COLORS.grid}" stroke-width="1" />
        <text x="${MARGIN.left - 8}" y="${y + 4}" text-anchor="end" font-size="13" fill="${COLORS.text}">${formatSalary(tick)}</text>`
    })
    .join('')

  // X-axis tick labels.
  const xLabels = xTicks
    .map((tick) => {
      const x = xScale(tick)
      return `<text x="${x}" y="${MARGIN.top + PLOT_H + 20}" text-anchor="middle" font-size="13" fill="${COLORS.text}">${tick}</text>`
    })
    .join('')

  // Scatter points.
  const circles = dataPoints
    .map(
      (p) =>
        `<circle cx="${xScale(p.score)}" cy="${yScale(p.adjustedSalary)}" r="4" fill="${pointColor(p.gender)}" fill-opacity="0.8" />`,
    )
    .join('')

  // Regression line, clipped to the plot area.
  const { slope, intercept } = regressionLine
  const xStart = slope !== 0 ? Math.max(0, -intercept / slope) : 0
  const x1 = xScale(xStart)
  const y1 = yScale(slope * xStart + intercept)
  const x2 = xScale(xMax)
  const y2 = yScale(slope * xMax + intercept)
  const regression = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORS.regression}" stroke-width="2.5" clip-path="url(#plot-clip)" />`

  // Legend below the x-axis.
  const legendY = MARGIN.top + PLOT_H + 46
  const legend = `
    <g font-size="13" fill="${COLORS.text}">
      <circle cx="${MARGIN.left}" cy="${legendY - 4}" r="5" fill="${COLORS.male}" />
      <text x="${MARGIN.left + 12}" y="${legendY}">Karl</text>
      <circle cx="${MARGIN.left + 90}" cy="${legendY - 4}" r="5" fill="${COLORS.female}" />
      <text x="${MARGIN.left + 102}" y="${legendY}">Kona</text>
      <line x1="${MARGIN.left + 180}" y1="${legendY - 4}" x2="${MARGIN.left + 210}" y2="${legendY - 4}" stroke="${COLORS.regression}" stroke-width="2.5" />
      <text x="${MARGIN.left + 218}" y="${legendY}">Meðallaun</text>
    </g>`

  return `
  <svg width="100%" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system, 'IBM Plex Sans', Arial, sans-serif">
    <defs>
      <clipPath id="plot-clip">
        <rect x="${MARGIN.left}" y="${MARGIN.top}" width="${PLOT_W}" height="${PLOT_H}" />
      </clipPath>
    </defs>
    ${gridAndYLabels}
    <line x1="${MARGIN.left}" y1="${MARGIN.top + PLOT_H}" x2="${MARGIN.left + PLOT_W}" y2="${MARGIN.top + PLOT_H}" stroke="${COLORS.grid}" stroke-width="1" />
    ${xLabels}
    <text x="${MARGIN.left + PLOT_W}" y="${MARGIN.top + PLOT_H + 38}" text-anchor="end" font-size="13" font-weight="bold" fill="${COLORS.text}">stig</text>
    <text x="${MARGIN.left}" y="${MARGIN.top - 8}" text-anchor="start" font-size="13" font-weight="bold" fill="${COLORS.text}">kr.</text>
    ${regression}
    ${circles}
    ${legend}
  </svg>`
}
