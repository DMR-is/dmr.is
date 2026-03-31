'use client'

import { useMemo, useState } from 'react'

import { Box } from '../../island-is/lib/Box'
import { Stack } from '../../island-is/lib/Stack'
import { Text } from '../../island-is/lib/Text'
import * as styles from './SearchDashboard.css'
import { SearchDashboardPanel } from './SearchDashboardPanel'
import type { SearchDashboardTrendChartProps } from './types'

const CHART_WIDTH = 560
const CHART_HEIGHT = 220
const CHART_PADDING = {
  top: 16,
  right: 16,
  bottom: 40,
  left: 48,
}

const formatAxisLabel = (label: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return `${label.slice(8, 10)}.${label.slice(5, 7)}`
  }

  return label
}

const getTickIndexes = (length: number) => {
  if (length <= 1) {
    return [0]
  }

  const indexes = new Set<number>()
  const steps = Math.min(length - 1, 4)

  for (let step = 0; step <= steps; step += 1) {
    indexes.add(Math.round((step / steps) * (length - 1)))
  }

  return [...indexes].sort((a, b) => a - b)
}

const getYTicks = (maxValue: number) => {
  const safeMax = Math.max(maxValue, 1)
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(safeMax * ratio))
}

type ChartPoint = {
  x: number
  y: number
  label: string
  value: number
}

type ChartRegion = {
  x: number
  width: number
}

const createTrendPath = (points: ChartPoint[]) => {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}

const createAreaPath = (points: ChartPoint[], baselineY: number) => {
  if (points.length === 0) {
    return ''
  }

  const line = createTrendPath(points)
  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]

  return `${line} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`
}

const toTrendId = (value: string) => {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export const SearchDashboardTrendChart = ({
  title,
  description,
  helpText,
  points,
  valueFormatter = (value) => value.toString(),
}: SearchDashboardTrendChartProps) => {
  const trendId = toTrendId(title)
  const [activeIndex, setActiveIndex] = useState(Math.max(points.length - 1, 0))

  const chart = useMemo(() => {
    const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom
    const maxValue = Math.max(...points.map((point) => point.value), 1)
    const safeDivisor = points.length > 1 ? points.length - 1 : 1

    const chartPoints: ChartPoint[] = points.map((point, index) => ({
      ...point,
      x: CHART_PADDING.left + (index / safeDivisor) * plotWidth,
      y: CHART_PADDING.top + plotHeight - (point.value / maxValue) * plotHeight,
    }))

    const yTicks = getYTicks(maxValue).map((value) => ({
      value,
      y: CHART_PADDING.top + plotHeight - (value / maxValue) * plotHeight,
    }))

    const interactiveRegions: ChartRegion[] = chartPoints.map(
      (point, index) => {
        const previousPoint = chartPoints[index - 1]
        const nextPoint = chartPoints[index + 1]
        const leftEdge = previousPoint
          ? (previousPoint.x + point.x) / 2
          : CHART_PADDING.left
        const rightEdge = nextPoint
          ? (point.x + nextPoint.x) / 2
          : CHART_WIDTH - CHART_PADDING.right

        return {
          x: leftEdge,
          width: Math.max(rightEdge - leftEdge, 1),
        }
      },
    )

    return {
      chartPoints,
      interactiveRegions,
      linePath: createTrendPath(chartPoints),
      areaPath: createAreaPath(chartPoints, CHART_PADDING.top + plotHeight),
      xTickIndexes: getTickIndexes(points.length),
      yTicks,
      plotHeight,
      baselineY: CHART_PADDING.top + plotHeight,
    }
  }, [points])

  const safeActiveIndex = Math.min(activeIndex, Math.max(points.length - 1, 0))
  const activePoint = points[safeActiveIndex]

  return (
    <SearchDashboardPanel
      title={title}
      description={description}
      helpText={helpText}
    >
      {points.length === 0 ? (
        <Box className={styles.trendEmpty}>
          <Text variant="small">Engin gögn á völdu tímabili</Text>
        </Box>
      ) : (
        <Stack space={2}>
          <Box className={styles.trendSummary}>
            <Text variant="small" color="dark400">
              {activePoint?.label ?? ''}
            </Text>
            <Text variant="small" fontWeight="semiBold" color="blue400">
              {activePoint ? valueFormatter(activePoint.value) : ''}
            </Text>
          </Box>
          <Box className={styles.trendChartWrap}>
            <svg
              aria-label={title}
              className={styles.trendSvg}
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              role="img"
            >
              <defs>
                <linearGradient id={`trend-gradient-${trendId}`} x1="0" x2="1">
                  <stop offset="0%" stopColor="#0061ff" />
                  <stop offset="100%" stopColor="#0bbf99" />
                </linearGradient>
                <linearGradient
                  id={`trend-area-${trendId}`}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#0061ff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0061ff" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              {chart.yTicks.map((tick, index) => (
                <g key={`y-tick-${index}-${tick.value}`}>
                  <line
                    className={styles.trendGridLine}
                    x1={CHART_PADDING.left}
                    x2={CHART_WIDTH - CHART_PADDING.right}
                    y1={tick.y}
                    y2={tick.y}
                  />
                  <text
                    className={styles.trendAxisLabel}
                    x={CHART_PADDING.left - 10}
                    y={tick.y + 4}
                    textAnchor="end"
                  >
                    {valueFormatter(tick.value)}
                  </text>
                </g>
              ))}
              <line
                className={styles.trendAxisLine}
                x1={CHART_PADDING.left}
                x2={CHART_WIDTH - CHART_PADDING.right}
                y1={chart.baselineY}
                y2={chart.baselineY}
              />
              <line
                className={styles.trendAxisLine}
                x1={CHART_PADDING.left}
                x2={CHART_PADDING.left}
                y1={CHART_PADDING.top}
                y2={chart.baselineY}
              />
              <path
                d={chart.areaPath}
                fill={`url(#trend-area-${trendId})`}
                stroke="none"
              />
              <path
                d={chart.linePath}
                fill="none"
                stroke={`url(#trend-gradient-${trendId})`}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              {chart.chartPoints.map((point, index) => {
                const isActive = index === safeActiveIndex
                const region = chart.interactiveRegions[index]

                return (
                  <g key={`${point.label}-${point.value}`}>
                    {region ? (
                      <rect
                        className={styles.trendColumnHit}
                        x={region.x}
                        y={CHART_PADDING.top}
                        width={region.width}
                        height={chart.plotHeight}
                        tabIndex={0}
                        role="button"
                        aria-label={`${point.label}: ${valueFormatter(point.value)}`}
                        onFocus={() => setActiveIndex(index)}
                        onMouseEnter={() => setActiveIndex(index)}
                      />
                    ) : null}
                    <circle
                      className={styles.trendPoint}
                      cx={point.x}
                      cy={point.y}
                      r={isActive ? 5 : 4}
                    />
                    {isActive ? (
                      <>
                        <line
                          className={styles.trendCrosshair}
                          x1={point.x}
                          x2={point.x}
                          y1={CHART_PADDING.top}
                          y2={chart.baselineY}
                        />
                        <circle
                          className={styles.trendPointActive}
                          cx={point.x}
                          cy={point.y}
                          r="8"
                        />
                      </>
                    ) : null}
                  </g>
                )
              })}
              {chart.xTickIndexes.map((index) => {
                const point = chart.chartPoints[index]

                if (!point) {
                  return null
                }

                return (
                  <g key={`x-tick-${point.label}`}>
                    <line
                      className={styles.trendAxisTick}
                      x1={point.x}
                      x2={point.x}
                      y1={chart.baselineY}
                      y2={chart.baselineY + 6}
                    />
                    <text
                      className={styles.trendAxisLabel}
                      x={point.x}
                      y={chart.baselineY + 22}
                      textAnchor="middle"
                    >
                      {formatAxisLabel(point.label)}
                    </text>
                  </g>
                )
              })}
            </svg>
          </Box>
        </Stack>
      )}
    </SearchDashboardPanel>
  )
}
