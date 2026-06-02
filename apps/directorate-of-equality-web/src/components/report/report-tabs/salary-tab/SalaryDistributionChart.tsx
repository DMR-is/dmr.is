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

  const malePoints = data.dataPoints.filter((p) => p.gender === 'MALE')
  const femalePoints = data.dataPoints.filter((p) => p.gender === 'FEMALE')
  const neutralPoints = data.dataPoints.filter((p) => p.gender === 'NEUTRAL')

  const allY = data.dataPoints.map((p) => p.adjustedSalary)
  const yMax = Math.ceil(Math.max(...allY, 1) / 100000) * 100000
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f))

  const xAxisMax =
    Math.ceil(
      (Math.max(...data.scoreBuckets.map((b) => b.rangeTo)) + 100) / 250,
    ) * 250

  const { slope, intercept } = data.regressionLine
  const xStart = slope !== 0 ? Math.max(0, -intercept / slope) : 0
  const regressionData = [
    { score: xStart, salary: slope * xStart + intercept },
    { score: xAxisMax, salary: slope * xAxisMax + intercept },
  ]

  return (
    <Box display="flex" flexDirection="column" rowGap={2} marginY={4}>
      <Text variant="h4">{reportText.salaryTab.chartTitle}</Text>
      <Text variant="default" marginBottom={4}>
        {reportText.salaryTab.chartDescription}
      </Text>

      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart margin={{ top: 24, right: 0, left: 0, bottom: 24 }}>
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
            dataKey="adjustedSalary"
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

          {neutralPoints.length > 0 && (
            <Scatter
              name="Hlutlaust"
              data={neutralPoints}
              fill={theme.color.yellow400}
              legendType="circle"
              opacity={0.8}
            />
          )}

          <Line
            data={regressionData}
            type="linear"
            dataKey="salary"
            name="Meðallaun"
            stroke={theme.color.roseTinted400}
            strokeWidth={2.5}
            dot={false}
            legendType="plainline"
            isAnimationActive={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  )
}
