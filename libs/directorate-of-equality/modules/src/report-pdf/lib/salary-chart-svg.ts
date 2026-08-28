import { GenderEnum } from '../../report/models/report.enums'
import { type WageGapPooledFitDto } from '../../report-result/dto/report-result.dto'
import { ScatterDataPointDto } from '../../report-statistics/dto/salary-by-gender-and-score.dto'
import { niceAxisMax } from '../../report-statistics/lib/axis-scale'

/**
 * Points sampled along the fitted curve. Matches `CURVE_SAMPLES` in the web
 * component — the two renderers are deliberate mirrors, so change both.
 */
const CURVE_SAMPLES = 48

/**
 * Colors mirror the admin `SalaryDistributionChart` (island-ui theme):
 * blue400 male points, purple400 female points (NEUTRAL is bundled into the
 * female series, M vs F+N) and the roseTinted400 regression line.
 */
const COLORS = {
  male: '#0061ff',
  female: '#6a2ea0',
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
  // NEUTRAL is bundled into the female series (M vs F+N).
  return gender === GenderEnum.MALE ? COLORS.male : COLORS.female
}

/**
 * Renders the salary-by-score scatter plot as a standalone inline `<svg>` string
 * for embedding in the PDF HTML. Pure.
 *
 * ⚠️ **Takes `pooledFit`, the log fit — NOT `statistics.regressionLine`.**
 *
 * This drew `regressionLine` until now, a LEVEL-space OLS that nothing else in
 * the system reads, while the úrbótaáætlun table on the same page prints
 * `expectedHourlyWage` and `deviationPercent` from the log fit. The two are
 * different models: on the reference demo cohort they disagree by 45,6% at the
 * bottom of the score range. So a reader could see a point sitting comfortably
 * ABOVE the drawn line whose table row said the employee was underpaid — the
 * chart contradicting the finding beside it. The web renderer had already been
 * moved to the log fit; this brings the PDF into line.
 *
 * The fitted line is a CURVE in krónur: `væntanlegt = exp(a + b·stig)`, so equal
 * steps in stig compound into growing steps in krónur. That is the model, not a
 * rendering choice — every Launafrávik is measured from this curve, so points
 * below it are exactly the underpaid ones.
 *
 * Mirrors the admin Recharts component throughout: y to a magnitude-derived nice
 * number (see {@link niceAxisMax} — the web carries a deliberate copy, change
 * both together), x to the nearest 250, and the curve sampled across the
 * OBSERVED score range only.
 */
export function buildSalaryChartSvg(
  dataPoints: ScatterDataPointDto[],
  // Only the two coefficients are needed, but typed off the DTO rather than
  // structurally: a rename in the snapshot then breaks this compile instead of
  // silently reading `undefined` and drawing nothing.
  pooledFit?: Pick<WageGapPooledFitDto, 'slope' | 'intercept'> | null,
): string {
  const xMax =
    Math.ceil((Math.max(...dataPoints.map((p) => p.score), 1) + 100) / 250) *
    250

  // ⚠️ Drawn only when the fit exists, and never defaulted to 0. The old code
  // coerced a null fit to a flat line across the chart, which reads as a
  // finding ("pay does not rise with score at all") rather than as absent data.
  // `slope === 0` is NOT the same case — a genuinely flat fit across a spread of
  // scores is a real result, and it is drawn as the horizontal line it is.
  //
  // One cohort shape draws nothing regardless: everybody on a SINGLE
  // starfsmatsstig. The observed range collapses to a point, so every sample
  // below lands on the same x and the polyline has no extent. That is the honest
  // outcome — there is no range to draw a line across, and stretching one to the
  // plot edge would be extrapolation from one x value. The scatter still shows
  // the column of points and the úrbótaáætlun table still carries every figure.
  const slope = pooledFit?.slope ?? null
  const intercept = pooledFit?.intercept ?? null
  const hasFit = slope !== null && intercept !== null

  // Sampled across the OBSERVED range, deliberately not out to `xMax`. The curve
  // is exponential, so extending it past the data would both extrapolate beyond
  // any support and inflate the y-axis until the real points flatten into the
  // bottom of the plot. The previous straight line DID run to `xMax`, which is
  // also why it could reach the plot edge and be clipped.
  const scores = dataPoints.map((p) => p.score)
  const curveFrom = scores.length > 0 ? Math.min(...scores) : 0
  const curveTo = scores.length > 0 ? Math.max(...scores) : 0
  const curve = hasFit
    ? Array.from({ length: CURVE_SAMPLES + 1 }, (_, i) => {
        const score = curveFrom + ((curveTo - curveFrom) * i) / CURVE_SAMPLES
        return { score, salary: Math.exp(intercept + slope * score) }
      })
    : []

  // The curve is included in the axis calculation: with a steep enough slope its
  // top end can sit above every observed wage, and omitting it clips the line at
  // the plot edge — which is what the old renderer did, since it scaled y from
  // the data points alone.
  const yMax = niceAxisMax(
    Math.max(
      ...dataPoints.map((p) => p.regularHourlyWage),
      ...curve.map((point) => point.salary),
      1,
    ),
  )

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
        `<circle cx="${xScale(p.score)}" cy="${yScale(p.regularHourlyWage)}" r="4" fill="${pointColor(p.gender)}" fill-opacity="0.8" />`,
    )
    .join('')

  // Regression line, clipped to the plot area.
  //
  const regression =
    curve.length === 0
      ? ''
      : `<polyline points="${curve
          .map((point) => `${xScale(point.score)},${yScale(point.salary)}`)
          .join(
            ' ',
          )}" fill="none" stroke="${COLORS.regression}" stroke-width="2.5" stroke-linejoin="round" clip-path="url(#plot-clip)" />`

  // Legend below the x-axis.
  const legendY = MARGIN.top + PLOT_H + 46
  const legend = `
    <g font-size="13" fill="${COLORS.text}">
      <circle cx="${MARGIN.left}" cy="${legendY - 4}" r="5" fill="${COLORS.male}" />
      <text x="${MARGIN.left + 12}" y="${legendY}">Karl</text>
      <circle cx="${MARGIN.left + 90}" cy="${legendY - 4}" r="5" fill="${COLORS.female}" />
      <text x="${MARGIN.left + 102}" y="${legendY}">Kona</text>
      <line x1="${MARGIN.left + 180}" y1="${legendY - 4}" x2="${MARGIN.left + 210}" y2="${legendY - 4}" stroke="${COLORS.regression}" stroke-width="2.5" />
      <text x="${MARGIN.left + 218}" y="${legendY}">Væntanlegt tímakaup</text>
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
    <text x="${MARGIN.left}" y="${MARGIN.top - 8}" text-anchor="start" font-size="13" font-weight="bold" fill="${COLORS.text}">kr./klst.</text>
    ${regression}
    ${circles}
    ${legend}
  </svg>`
}
