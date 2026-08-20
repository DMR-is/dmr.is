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

import { SalaryByGenderAndScoreDto } from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
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


type Props = {
  data: SalaryByGenderAndScoreDto | null | undefined
}

export function SalaryDistributionChart({ data }: Props) {
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

  // ⚠️ Nullable, and not defaulted to 0. A null fit used to be coerced to
  // `slope: 0`, drawing a flat line that reads as "pay does not rise with score
  // at all" — a finding rather than absent data. `hasFit` gates both the drawn
  // line and the printed figures below. `slope === 0` is a DIFFERENT case: a
  // real degenerate fit from identical scores, which does draw.
  const { slope, intercept, rSquared } = data.regressionLine
  const hasFit = slope != null && intercept != null
  const predict = (score: number) =>
    hasFit ? slope * score + intercept : 0

  // NEUTRAL is bundled into the female series (M vs F+N).
  //
  // ⚠️ There is deliberately NO tolerance band. This chart used to shade a
  // ±1,95% wedge around the line, which was the old per-employee outlier rule.
  // Compliance is now decided by the company-wide óskýrt figure against 3,9%,
  // so a shaded corridor here would decide nothing while looking exactly like
  // it did — a reviewer would read points outside it as findings. The line stays
  // as orientation; the úrbótaáætlun table carries the actual list.
  const malePoints = data.dataPoints.filter((p) => p.gender === 'MALE')
  const femalePoints = data.dataPoints.filter((p) => p.gender !== 'MALE')

  const allY = data.dataPoints.map((p) => p.regularHourlyWage)
  const yMax = niceAxisMax(Math.max(...allY, 1))
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f))

  const xAxisMax =
    Math.ceil(
      (Math.max(...data.scoreBuckets.map((b) => b.rangeTo)) + 100) / 250,
    ) * 250

  const xStart =
    hasFit && slope !== 0 ? Math.max(0, -intercept / slope) : 0
  const regressionData = hasFit
    ? [
        { score: xStart, salary: predict(xStart) },
        { score: xAxisMax, salary: predict(xAxisMax) },
      ]
    : []

  return (
    <Box display="flex" flexDirection="column" rowGap={2} marginY={4}>
      <Text variant="h4">{reportText.salaryTab.chartTitle}</Text>
      <Text variant="default" marginBottom={4}>
        {reportText.salaryTab.chartDescription}
      </Text>

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
              type="linear"
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

      <RegressionReadout
        slope={slope}
        intercept={intercept}
        rSquared={rSquared}
      />
    </Box>
  )
}

/**
 * The fitted line, in words.
 *
 * Requested so a reviewer can see the model rather than only its picture. R² is
 * the load-bearing one: it says how much of the pay variation the starfsmatsstig
 * actually explain — i.e. how much the line deserves to be trusted — which
 * matters more than the intercept does.
 *
 * ⚠️ Every value renders `—` when null. `Hallatala: 0` would read as a genuine
 * finding ("pay does not rise with score"), which is why these fields became
 * nullable on the API rather than being coerced to zero.
 *
 * Note skurðpunktur is predicted pay at score 0, a job no company has, so its
 * hint stays deliberately vague about what it means.
 */
function RegressionReadout({
  slope,
  intercept,
  rSquared,
}: {
  slope?: number | null
  intercept?: number | null
  rSquared?: number | null
}) {
  const t = reportText.salaryTab
  const num = (v: number | null | undefined, digits: number) =>
    v == null
      ? '—'
      : v.toLocaleString('is-IS', {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        })

  const rows = [
    { label: t.slopeLabel, value: `${num(slope, 3)} ${t.slopeUnit}`, hint: t.slopeHint },
    {
      label: t.interceptLabel,
      value: intercept == null ? '—' : `${formatSalary(intercept)} ${t.hourlyUnit}`,
      hint: t.interceptHint,
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
