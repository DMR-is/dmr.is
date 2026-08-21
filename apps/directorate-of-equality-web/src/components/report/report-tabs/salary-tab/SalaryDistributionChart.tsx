'use client'

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { theme } from '@island.is/island-ui/theme'

import {
  SalaryByGenderAndScoreDto,
  type WageGapDecompositionDto,
} from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { CohortSummary } from './CohortSummary'
function formatSalary(v: number) {
  return new Intl.NumberFormat('is-IS')
    .format(Math.round(v))
    .replaceAll(',', '.')
}

/**
 * Y-axis upper bound, derived from the data's own magnitude.
 *
 * ⚠️ **Deliberate copy of `niceAxisMax` in the API's
 * `report-statistics/lib/axis-scale.ts` — change both together.** The PDF
 * renderer and this component must agree, or the same report shows two
 * different axes depending on where you look at it. There is no shared lib
 * between the two apps, and this component's axis logic was already mirrored by
 * hand before.
 *
 * Replaces a fixed round-up to the nearest 100.000, which was fine for
 * FTE-adjusted monthly salaries but put every reglulegt tímakaup (~4.900
 * kr./klst.) in the bottom 5% of a single band, with ticks reading
 * 0 / 25.000 / … / 100.000.
 */
const NICE_AXIS_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]

function niceAxisMax(dataMax: number) {
  if (!Number.isFinite(dataMax) || dataMax <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(dataMax))
  const normalised = dataMax / magnitude
  const step = NICE_AXIS_STEPS.find((c) => normalised <= c) ?? 10
  return step * magnitude
}

/** How many points the curve is sampled at. Enough to read as smooth. */
const CURVE_SAMPLES = 48

type Props = {
  data: SalaryByGenderAndScoreDto | null | undefined
  /**
   * The frozen decomposition. Supplies the ONE line worth drawing — see the
   * note on `pooledFit` below. Absent for a report with no computed result, in
   * which case the chart is a bare scatter.
   */
  decomposition?: WageGapDecompositionDto | null
}

export function SalaryDistributionChart({ data, decomposition }: Props) {
  if (!data) {
    return (
      <div
        style={{
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        {reportText.salaryTab.noDataMessage}
      </div>
    )
  }

  // ⚠️ **This draws the pooled LOG fit, not `data.regressionLine`.**
  //
  // `regressionLine` is a level-space OLS line, and it decides nothing. Every
  // number a reviewer acts on — `Væntanlegt tímakaup` and `Launafrávik` in the
  // úrbótaáætlun table, and which employees land in the lágmarksmengi — is
  // measured against `exp(intercept + slope · stig)` from the decomposition's
  // pooled (Neumark) fit. Drawing the level line instead meant the chart showed
  // a model with no bearing on the verdict, so a point sitting above the drawn
  // line could still be flagged as underpaid. This curve IS the threshold:
  // below it is underpaid, and the lágmarksmengi is drawn from those points.
  //
  // Nullable throughout, and never defaulted to 0: a null fit draws no curve
  // rather than a flat one, because a flat line reads as "pay does not rise
  // with score" — a finding rather than absent data.
  const fit = decomposition?.pooledFit
  const slope = fit?.slope ?? null
  const intercept = fit?.intercept ?? null
  const rSquared = fit?.rSquared ?? null
  const hasFit = slope != null && intercept != null
  /** Level-space kr./klst. — the curve is a straight line in log space only. */
  const predict = (score: number) =>
    hasFit ? Math.exp(intercept + slope * score) : 0

  // NEUTRAL is bundled into the female series (M vs F+N).
  //
  // ⚠️ There is deliberately NO tolerance band. This chart used to shade a
  // ±1,95% wedge around the line, which was the old per-employee outlier rule.
  // Compliance is decided by the company-wide óskýrt figure against 3,9%, so a
  // shaded corridor would decide nothing while looking exactly like it did — a
  // reviewer would read points outside it as findings.
  //
  // The CURVE, by contrast, is load-bearing: it is the line every Launafrávik in
  // the úrbótaáætlun table is measured from, so points below it are precisely
  // the underpaid ones the lágmarksmengi is selected out of. That is why a band
  // is redundant here rather than merely unwanted — the curve already marks the
  // only boundary that means anything.
  const malePoints = data.dataPoints.filter((p) => p.gender === 'MALE')
  const femalePoints = data.dataPoints.filter((p) => p.gender !== 'MALE')

  const xAxisMax =
    Math.ceil(
      (Math.max(...data.scoreBuckets.map((b) => b.rangeTo)) + 100) / 250,
    ) * 250

  // Sampled across the OBSERVED score range only, deliberately not out to
  // `xAxisMax`. Two reasons: the curve is exponential, so extending it past the
  // data would both extrapolate beyond any support and inflate the y-axis until
  // the real points flatten into the bottom of the plot; and the model has
  // nothing to say about scores nobody holds.
  const scores = data.dataPoints.map((p) => p.score)
  const curveFrom = scores.length > 0 ? Math.min(...scores) : 0
  const curveTo = scores.length > 0 ? Math.max(...scores) : 0
  const regressionData = hasFit
    ? Array.from({ length: CURVE_SAMPLES + 1 }, (_, i) => {
        const score = curveFrom + ((curveTo - curveFrom) * i) / CURVE_SAMPLES
        return { score, salary: predict(score) }
      })
    : []

  // The curve is included in the axis calculation: with a steep enough slope its
  // top end can sit above every observed wage, and omitting it would clip the
  // line at the plot edge.
  const allY = [
    ...data.dataPoints.map((p) => p.regularHourlyWage),
    ...regressionData.map((point) => point.salary),
  ]
  const yMax = niceAxisMax(Math.max(...allY, 1))
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f))

  return (
    <Box display="flex" flexDirection="column" rowGap={2} marginY={4}>
      <Text variant="h4">{reportText.salaryTab.chartTitle}</Text>
      <Text variant="default">{reportText.salaryTab.chartDescription}</Text>
      {/* Cohort size reads as chart context here rather than as a stray stat
          above the heading, and it qualifies the curve directly: a line fitted
          through six points deserves less trust than one through six hundred. */}
      <Box marginBottom={2}>
        <CohortSummary totals={data.totals} />
      </Box>

      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart
          margin={{ top: 24, right: 0, left: 0, bottom: 24 }}
          style={{ outline: 'none' }}
        >
          <CartesianGrid vertical={false} stroke={theme.color.blue200} />
          <XAxis
            type="number"
            dataKey="score"
            domain={[0, xAxisMax]}
            ticks={Array.from(
              { length: Math.ceil(xAxisMax / 250) + 1 },
              (_, i) => i * 250,
            )}
            stroke={theme.color.blue200}
            tickLine={false}
            tick={{ fill: theme.color.black, fontSize: 14 }}
            label={{
              value: reportText.salaryTab.chartScaleScore,
              position: 'insideBottomRight',
              dx: 5,
              dy: 10,
              fontWeight: 'bold',
              fill: theme.color.black,
              fontSize: 14,
            }}
          />

          <YAxis
            type="number"
            dataKey="regularHourlyWage"
            domain={[0, yMax]}
            ticks={yTicks}
            tickFormatter={formatSalary}
            stroke={theme.color.blue200}
            tickLine={false}
            tick={{ fill: theme.color.black, fontSize: 14 }}
            width={95}
            label={{
              value: reportText.salaryTab.chartScaleCurrency,
              position: 'insideTop',
              offset: -22,
              fontWeight: 'bold',
              fill: theme.color.black,
              fontSize: 14,
              dx: 32,
            }}
          />

          <Tooltip
            formatter={(
              value: number | undefined,
              name: string | undefined,
            ) => {
              if (value == null) return ['', name ?? '']
              if (name === 'score')
                return [String(value), reportText.salaryTab.chartTooltipScore]
              return [
                formatSalary(value),
                reportText.salaryTab.chartTooltipSalary,
              ]
            }}
          />

          <Legend
            wrapperStyle={{
              paddingTop: 16,
              fontSize: 13,
              color: theme.color.black,
            }}
          />

          {malePoints.length > 0 && (
            <Scatter
              name="Karl"
              data={malePoints}
              fill={theme.color.blue400}
              legendType="circle"
              opacity={0.8}
            />
          )}

          {femalePoints.length > 0 && (
            <Scatter
              name="Kona"
              data={femalePoints}
              fill={theme.color.purple400}
              legendType="circle"
              opacity={0.8}
            />
          )}

          {regressionData.length > 0 && (
            <Line
              data={regressionData}
              type="monotone"
              dataKey="salary"
              name={reportText.salaryTab.chartRegressionSeries}
              stroke={theme.color.roseTinted400}
              strokeWidth={2.5}
              dot={false}
              legendType="plainline"
              isAnimationActive={true}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <RegressionReadout slope={slope} rSquared={rSquared} />
    </Box>
  )
}

/**
 * The reference curve, in words.
 *
 * Describes the pooled log fit that the chart draws and that the úrbótaáætlun is
 * built from — so a reviewer can see the model, not just its picture.
 *
 * ⚠️ **Deliberately does NOT print a hallatala or a skurðpunktur.** The fit is
 * in log space: its slope is a proportional rate, not kr./klst. per stig, and
 * its intercept is `log` of a wage at score 0. Printing either under the old
 * labels would state a wrong unit. The slope is therefore converted to the
 * thing it actually means — how much the expected wage rises across 100 stig —
 * and the intercept is dropped rather than mislabelled.
 *
 * R² is the load-bearing figure: it says how much of the pay variation the
 * starfsmatsstig explain, i.e. how much the curve deserves to be trusted, which
 * matters more to a reviewer than any coefficient.
 */
function RegressionReadout({
  slope,
  rSquared,
}: {
  slope?: number | null
  rSquared?: number | null
}) {
  const t = reportText.salaryTab

  if (slope == null) {
    return (
      <Box marginTop={2}>
        <Text variant="small" color="dark300">
          {t.curveUnavailable}
        </Text>
      </Box>
    )
  }

  const num = (v: number | null | undefined, digits: number) =>
    v == null
      ? '—'
      : v.toLocaleString('is-IS', {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        })

  // exp(slope · 100) − 1: the compounded proportional rise over 100 stig. Not
  // `slope · 100`, which would be the log-space increment and understate it.
  const growthPercent = (Math.exp(slope * 100) - 1) * 100

  const rows = [
    {
      label: t.curveGrowthLabel,
      value: `${num(growthPercent, 1)}%`,
      hint: t.curveGrowthHint,
    },
    { label: t.rSquaredLabel, value: num(rSquared, 2), hint: t.rSquaredHint },
  ]

  return (
    <Box marginTop={2}>
      <Text variant="h5">{t.regressionHeading}</Text>
      {rows.map((row) => (
        <Box key={row.label} display="flex" columnGap={2} marginTop={1}>
          <Text variant="small" fontWeight="semiBold">
            {row.label}
          </Text>
          <Text variant="small">{row.value}</Text>
          <Text variant="small" color="dark300">
            {row.hint}
          </Text>
        </Box>
      ))}
    </Box>
  )
}
