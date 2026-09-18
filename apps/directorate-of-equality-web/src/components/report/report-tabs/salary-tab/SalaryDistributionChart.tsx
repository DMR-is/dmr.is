'use client'

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { theme } from '@island.is/island-ui/theme'

import {
  type PayDispersionDto,
  SalaryByGenderAndScoreDto,
  type WageGapDecompositionDto,
  type WageGapEmployeeDto,
} from '../../../../gen/fetch'
import { reportText, sharedText } from '../../../../lib/text'
import { formatHourlyRate, formatPercent } from '../../../../lib/utils'
import { CohortSummary } from './CohortSummary'
import * as styles from './SalaryDistributionChart.css'
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

/**
 * One plotted employee. `employee` is null only on the no-decomposition
 * fallback, where the source rows carry no identity.
 */
type ChartPoint = {
  score: number
  regularHourlyWage: number
  gender: string
  employee: WageGapEmployeeDto | null
  marked: boolean
}

/**
 * Whether this employee is on the list the report actually has.
 *
 * ⚠️ Exactly one instrument applies per report, so there is no collision to
 * resolve. A lágmarksmengi exists only when the company is OVER the benchmark;
 * ábendingar rows are produced only when it is under. Keying on
 * `oskyrtWithinBenchmark === false` rather than on `minimumSetSize > 0` keeps
 * that the same test the rest of the app uses — the two came apart when the
 * selection walk gained the ability to decline every candidate.
 */
function isMarked(
  employee: WageGapEmployeeDto,
  decomposition: WageGapDecompositionDto,
  payDispersion: PayDispersionDto | null | undefined,
): boolean {
  if (decomposition.oskyrtWithinBenchmark === false) {
    return employee.inMinimumSet
  }

  return (
    payDispersion?.employees.some(
      (row) => row.employeeOrdinal === employee.ordinal,
    ) ?? false
  )
}

/** Renders nothing, so the curve's points have no hoverable geometry. */
function NoSymbol() {
  return <g />
}

/**
 * A plotted employee, ringed when they are on the report's list.
 *
 * ⚠️ A ring rather than a different fill, so the dot keeps saying which gender
 * it is. Splitting into marked/unmarked series instead would have doubled the
 * legend and thrown away that pairing.
 */
function EmployeeDot(props: {
  cx?: number
  cy?: number
  fill?: string
  payload?: ChartPoint
}) {
  const { cx, cy, fill, payload } = props
  if (cx == null || cy == null) return null

  const marked = payload?.marked === true

  return (
    <g>
      {/*
        ⚠️ An invisible target CONCENTRIC with the visible dot, drawn first.

        The visible radius is 4px, which is a very small thing to point at, and
        recharts hit-tests the rendered geometry — so the dot itself was
        awkward to hit while the space around it sometimes answered instead.
        Growing the visible dot would clutter a 120-point scatter; growing an
        invisible one centred on the same cx/cy keeps the picture and makes the
        target symmetric about what the eye is aiming at.
      */}
      <circle cx={cx} cy={cy} r={10} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={marked ? 6 : 4}
        fill={fill}
        fillOpacity={marked ? 1 : 0.8}
        stroke={marked ? theme.color.dark400 : 'none'}
        strokeWidth={marked ? 2 : 0}
        pointerEvents="none"
      />
    </g>
  )
}

/**
 * A plotted employee rather than a curve sample.
 *
 * `employee` is the discriminator rather than `gender`: a curve sample is
 * `{ score, salary }`, so it has neither, but only `ChartPoint` declares
 * `employee` — including on the fallback path, where it is explicitly null.
 */
function isChartPoint(datum: unknown): datum is ChartPoint {
  return (
    typeof datum === 'object' &&
    datum !== null &&
    'employee' in datum &&
    'gender' in datum
  )
}

/**
 * Per-point tooltip.
 *
 * ⚠️ Reached only because `<Tooltip shared={false}>` puts recharts in ITEM mode.
 * In its default axis mode this got whatever series sat nearest the hovered
 * stig — so hovering a dot could show the curve's numbers, or a colleague's.
 *
 * Three shapes to render: a curve sample, an identified employee, and the
 * fallback point with no identity at all.
 */
function ChartTooltip({
  active,
  payload,
  markedLabel,
}: {
  active?: boolean
  payload?: { payload?: ChartPoint | Record<string, unknown> }[]
  markedLabel: string
}) {
  const t = reportText.salaryTab.chartTooltip
  const datum = active ? payload?.[0]?.payload : undefined

  // ⚠️ Employee points only. The curve's samples are `{ score, salary }` and
  // would render a heading with an em dash for every field — recharts can still
  // activate the Line series, so this is the backstop that keeps the curve from
  // producing a tooltip at all.
  if (!isChartPoint(datum)) return null

  const rows: [string, string][] = []
  const { employee } = datum
  const heading = employee
    ? `${t.employee} ${employee.ordinal}`
    : reportText.salaryTab.chartTitle

  if (employee) rows.push([t.gender, genderLabel(employee.gender)])
  rows.push([t.score, String(Math.round(datum.score))])
  rows.push([t.salary, formatHourlyRate(datum.regularHourlyWage)])

  if (employee) {
    rows.push([t.expected, formatHourlyRate(employee.expectedHourlyWage)])
    // Signed percentage plus the direction word, matching both tables and the
    // PDF — the sign alone only works for a reader who knows the convention.
    const direction =
      employee.payStatus === 'UNDERPAID'
        ? reportText.salaryTab.payDispersion.directionBelow
        : employee.payStatus === 'OVERPAID'
          ? reportText.salaryTab.payDispersion.directionAbove
          : null
    const deviation = formatPercent(employee.deviationPercent, { signed: true })
    rows.push([
      t.deviation,
      direction ? `${deviation} (${direction})` : deviation,
    ])
  }

  return (
    <Box
      background="white"
      borderRadius="standard"
      padding={2}
      style={{
        border: `1px solid ${theme.color.blue200}`,
        boxShadow: '0 2px 8px rgba(0, 0, 60, 0.12)',
      }}
    >
      <Text variant="small" fontWeight="semiBold">
        {heading}
      </Text>
      {rows.map(([label, value]) => (
        <Box key={label} display="flex" columnGap={1}>
          <Text variant="small" color="dark350">
            {label}:
          </Text>
          <Text variant="small">{value}</Text>
        </Box>
      ))}
      {datum.marked && (
        <Box marginTop={1}>
          <Text variant="small" fontWeight="semiBold">
            {markedLabel}
          </Text>
        </Box>
      )}
    </Box>
  )
}

/** Gender code → Icelandic. NEUTRAL is shown as itself here, not folded. */
function genderLabel(gender: string): string {
  if (gender === 'MALE') return sharedText.genders.male
  if (gender === 'FEMALE') return sharedText.genders.female
  return sharedText.genders.neutral
}

/**
 * The chart's key, rendered by hand.
 *
 * ⚠️ Not recharts' automatic legend: the marked swatch has to read as a RING to
 * match the dots it describes, and recharts 3 does not allow supplying a legend
 * payload (`Legend` is typed `Omit<Props, 'payload' | …>`). Drawing it here also
 * keeps the four entries in a fixed order rather than series-declaration order.
 */
function ChartLegend({
  hasMale,
  hasFemale,
  hasCurve,
  markedLabel,
}: {
  hasMale: boolean
  hasFemale: boolean
  hasCurve: boolean
  /** Null when nothing on this report is marked. */
  markedLabel: string | null
}) {
  const items: { label: string; swatch: React.ReactNode }[] = []
  const dot = (fill: string) => (
    <svg width={12} height={12} aria-hidden>
      <circle cx={6} cy={6} r={5} fill={fill} fillOpacity={0.8} />
    </svg>
  )

  if (hasMale) items.push({ label: 'Karl', swatch: dot(theme.color.blue400) })
  if (hasFemale)
    items.push({ label: 'Kona', swatch: dot(theme.color.purple400) })
  if (hasCurve) {
    items.push({
      label: reportText.salaryTab.chartRegressionSeries,
      swatch: (
        <svg width={16} height={12} aria-hidden>
          <line
            x1={0}
            y1={6}
            x2={16}
            y2={6}
            stroke={theme.color.roseTinted400}
            strokeWidth={2.5}
          />
        </svg>
      ),
    })
  }
  if (markedLabel) {
    items.push({
      label: markedLabel,
      swatch: (
        <svg width={14} height={14} aria-hidden>
          {/* Unfilled: the ring means membership, and membership is not a
              gender. A blue fill here read as "karl". */}
          <circle
            cx={7}
            cy={7}
            r={5}
            fill="none"
            stroke={theme.color.dark400}
            strokeWidth={2}
          />
        </svg>
      ),
    })
  }

  return (
    <Box display="flex" justifyContent="center" columnGap={3} flexWrap="wrap">
      {items.map((item) => (
        <Box key={item.label} display="flex" alignItems="center" columnGap={1}>
          {item.swatch}
          <Text variant="small">{item.label}</Text>
        </Box>
      ))}
    </Box>
  )
}

type Props = {
  data: SalaryByGenderAndScoreDto | null | undefined
  /**
   * The frozen decomposition. Supplies the ONE line worth drawing — see the
   * note on `pooledFit` below — and, via `employees[]`, the identity of every
   * plotted point. Absent for a report with no computed result, in which case
   * the chart falls back to `data.dataPoints`: a bare scatter with no marks and
   * no per-point tooltip, because those rows carry no identity.
   */
  decomposition?: WageGapDecompositionDto | null
  /**
   * Ábendingar, derived on read. Supplies the marks on a report that is WITHIN
   * the benchmark; above it the marks come from `inMinimumSet` instead. See
   * `markedOrdinals` below for why only one of the two can ever apply.
   */
  payDispersion?: PayDispersionDto | null
}

export function SalaryDistributionChart({
  data,
  decomposition,
  payDispersion,
}: Props) {
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
  //
  // What the chart marks instead is MEMBERSHIP: the dots on whichever list this
  // report actually has. That is a fact about the report rather than a corridor
  // a reader could mistake for the rule. See `isMarked`.

  // ⚠️ Plotted from `decomposition.employees[]`, NOT `data.dataPoints`.
  //
  // `dataPoints` is `{ score, regularHourlyWage, gender }` — no identity at all.
  // Marking a dot or giving it its own tooltip is impossible from that without
  // matching on position, which is fragile the moment two employees share a
  // score and a rate. `employees[]` carries the ordinal, `payStatus`,
  // `expectedHourlyWage`, `deviationPercent` and `inMinimumSet` — every figure
  // the tooltip prints and the mark depends on.
  //
  // One visible difference: `dataPoints` includes rows EXCLUDED for a
  // non-positive wage, which plot at y = 0; `employees[]` does not.
  // `counts.excluded` is 0 on every cohort we have, and dropping a noise dot at
  // zero is the better behaviour when it is not.
  //
  // No decomposition ⇒ fall back to `dataPoints` for a bare scatter. Identity is
  // simply unavailable there, so `marked` is false and the tooltip degrades to
  // score and wage.
  const points: ChartPoint[] = decomposition?.employees?.length
    ? decomposition.employees.map((employee) => ({
        score: employee.score,
        regularHourlyWage: employee.hourlyWage,
        gender: employee.gender,
        employee,
        marked: isMarked(employee, decomposition, payDispersion),
      }))
    : data.dataPoints.map((point) => ({
        score: point.score,
        regularHourlyWage: point.regularHourlyWage,
        gender: point.gender,
        employee: null,
        marked: false,
      }))

  const malePoints = points.filter((p) => p.gender === 'MALE')
  const femalePoints = points.filter((p) => p.gender !== 'MALE')

  /** Which instrument the marks represent — drives the legend and the tooltip. */
  const markedLabel =
    decomposition?.oskyrtWithinBenchmark === false
      ? reportText.salaryTab.chartMarkedLegend.minimumSet
      : reportText.salaryTab.chartMarkedLegend.abending
  const hasMarked = points.some((p) => p.marked)

  const xAxisMax =
    Math.ceil(
      (Math.max(...data.scoreBuckets.map((b) => b.rangeTo)) + 100) / 250,
    ) * 250

  // Sampled across the OBSERVED score range only, deliberately not out to
  // `xAxisMax`. Two reasons: the curve is exponential, so extending it past the
  // data would both extrapolate beyond any support and inflate the y-axis until
  // the real points flatten into the bottom of the plot; and the model has
  // nothing to say about scores nobody holds.
  const scores = points.map((p) => p.score)
  const curveFrom = scores.length > 0 ? Math.min(...scores) : 0
  const curveTo = scores.length > 0 ? Math.max(...scores) : 0
  const regressionData = hasFit
    ? Array.from({ length: CURVE_SAMPLES + 1 }, (_, i) => {
        const score = curveFrom + ((curveTo - curveFrom) * i) / CURVE_SAMPLES
        // Keyed `regularHourlyWage`, matching the YAxis dataKey — a Scatter
        // reads its position from the axes, unlike Line's own `dataKey`.
        return { score, regularHourlyWage: predict(score) }
      })
    : []

  // The curve is included in the axis calculation: with a steep enough slope its
  // top end can sit above every observed wage, and omitting it would clip the
  // line at the plot edge.
  const allY = [
    ...points.map((p) => p.regularHourlyWage),
    ...regressionData.map((point) => point.regularHourlyWage),
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

      <ResponsiveContainer
        width="100%"
        height={420}
        className={styles.chartFocus}
      >
        {/*
          ⚠️ `ScatterChart`, NOT `ComposedChart`, and the reason is not stylistic.
          `ComposedChart` declares `allowedTooltipTypes = ['axis']`, so recharts
          validates any requested `item` event type straight back to `axis` —
          `shared={false}` was silently ignored. The tooltip then activated on the
          nearest X, which meant hovering anywhere in a dot's vertical strip
          (including well below it, or over a neighbour in a cluster) produced
          that dot's card. `ScatterChart` declares `['item']`, which is the only
          way to get a tooltip bound to the symbol the pointer is actually over.
        */}
        <ScatterChart margin={{ top: 24, right: 0, left: 0, bottom: 24 }}>
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

          {/*
            ⚠️ Dots only — the CURVE deliberately has no hover.
            An earlier attempt overlaid invisible hit targets on the curve
            samples, since the Line is drawn `dot={false}` and recharts activates
            item tooltips on a line's dots. It worked, and it was worse: the
            targets sat on top of every employee dot near the line, which is
            exactly where the interesting ones are, so hovering a dot got you the
            curve instead. Væntanlegt tímakaup is already on each dot's tooltip
            and in the readout below the chart, so nothing was lost by dropping
            it. Do not re-add without solving that overlap.

            ⚠️ `shared={false}` is the fix, not the custom content.
            Without it recharts runs in AXIS mode: it snaps to the nearest stig,
            draws a vertical cursor, and shows every series sitting at that x —
            so hovering an employee could report the curve's numbers, or a
            colleague's. `cursor={false}` removes the line that behaviour drew.
          */}
          <Tooltip
            cursor={false}
            // Recharts animates the card BETWEEN positions, so moving from one
            // dot to the next slid the panel across the plot at 400ms. For a
            // per-point tooltip that reads as lag: appear where the pointer is,
            // immediately.
            isAnimationActive={false}
            content={<ChartTooltip markedLabel={markedLabel} />}
          />

          {/*
            The ring gets its own swatch, with a label that follows WHICH list
            the report has — otherwise a reviewer sees a marked dot and has to
            guess what marked it. Only added when something is actually marked.
          */}
          {/*
            ⚠️ Custom `content`, not a `payload` override — recharts 3 types
            `Legend` as `Omit<Props, 'payload' | …>`, so the payload cannot be
            supplied. Rendering it ourselves is also what lets the marked swatch
            be drawn as a RING rather than a filled circle, which is the thing it
            has to communicate.
          */}
          <Legend
            wrapperStyle={{ paddingTop: 16 }}
            content={
              <ChartLegend
                hasMale={malePoints.length > 0}
                hasFemale={femalePoints.length > 0}
                hasCurve={regressionData.length > 0}
                markedLabel={hasMarked ? markedLabel : null}
              />
            }
          />

          {malePoints.length > 0 && (
            <Scatter
              name="Karl"
              data={malePoints}
              fill={theme.color.blue400}
              legendType="none"
              shape={<EmployeeDot />}
            />
          )}

          {femalePoints.length > 0 && (
            <Scatter
              name="Kona"
              data={femalePoints}
              fill={theme.color.purple400}
              legendType="none"
              shape={<EmployeeDot />}
            />
          )}

          {/*
            The curve, drawn as a Scatter whose points are joined and whose
            symbols render nothing. `<Line>` belongs to ComposedChart; this is
            ScatterChart's idiom for the same picture. 49 straight segments are
            indistinguishable from a smoothed curve at this width.

            ⚠️ `NoSymbol` renders an empty group, so the curve has NO hoverable
            geometry — which is what keeps the line hover gone now that the chart
            is genuinely in item mode.
          */}
          {regressionData.length > 0 && (
            <Scatter
              data={regressionData}
              name={reportText.salaryTab.chartRegressionSeries}
              line={{
                stroke: theme.color.roseTinted400,
                strokeWidth: 2.5,
              }}
              lineType="joint"
              shape={<NoSymbol />}
              legendType="none"
              isAnimationActive={false}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>

      <RegressionReadout
        slope={slope}
        intercept={intercept}
        meanScore={fit?.xMean ?? null}
        rSquared={rSquared}
      />
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
  intercept,
  meanScore,
  rSquared,
}: {
  slope?: number | null
  intercept?: number | null
  /** `pooledFit.xMean` — the cohort's mean starfsmatsstig. */
  meanScore?: number | null
  rSquared?: number | null
}) {
  const t = reportText.salaryTab

  if (slope == null) {
    return (
      <Box marginTop={2}>
        <Text variant="small" color="dark350">
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

  // The krónur anchor for the percentage above: a real point ON the curve, at
  // the cohort's own mean score. Deliberately not `exp(intercept)`, which is pay
  // at zero stig — outside any support, and a number a reader could mistake for
  // a floor.
  const expectedAtMeanScore =
    intercept != null && meanScore != null
      ? Math.exp(intercept + slope * meanScore)
      : null

  const rows = [
    {
      label: t.curveGrowthLabel,
      value: `${num(growthPercent, 1)}%`,
      hint: t.curveGrowthHint,
    },
    {
      label: t.curveAtMeanLabel,
      value: formatHourlyRate(expectedAtMeanScore),
      hint: t.curveAtMeanHint,
    },
    { label: t.rSquaredLabel, value: num(rSquared, 2), hint: t.rSquaredHint },
  ]

  return (
    <Box marginTop={2}>
      <Text variant="h5">{t.regressionHeading}</Text>
      <Box marginTop={1} marginBottom={1}>
        <Text variant="small" color="dark350">
          {t.chartCurveNote}
        </Text>
      </Box>
      {rows.map((row) => (
        <Box key={row.label} display="flex" columnGap={2} marginTop={1}>
          <Text variant="small" fontWeight="semiBold">
            {row.label}
          </Text>
          <Text variant="small">{row.value}</Text>
          <Text variant="small" color="dark350">
            {row.hint}
          </Text>
        </Box>
      ))}
    </Box>
  )
}
