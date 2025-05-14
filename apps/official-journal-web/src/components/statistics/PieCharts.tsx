import dynamic from 'next/dynamic'

import { Pie } from 'recharts'

import {
  Box,
  Inline,
  SkeletonLoader,
  Stack,
  Table as T,
  Text,
} from '@island.is/island-ui/core'
import { theme } from '@island.is/island-ui/theme'

import {
  CaseStatusEnum,
  GetStatisticsDepartmentResponse,
} from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { PIE_CHART_DIMENSION } from '../../lib/constants'
import { toFixed } from '../../lib/utils'
import { messages } from './messages'
import * as styles from './Statistics.css'

type Props = {
  data?: GetStatisticsDepartmentResponse
  loading?: boolean
}

const PieChart = dynamic(
  () => import('recharts').then((recharts) => recharts.PieChart),
  { ssr: false },
)

export const StatisticsPieCharts = ({ data, loading }: Props) => {
  const { formatMessage } = useFormatMessage()

  const mapTitleToColor = (name: string) => {
    switch (name) {
      case CaseStatusEnum.Innsent:
        return theme.color.dark400
      case CaseStatusEnum.Grunnvinnsla:
        return theme.color.blue400
      case CaseStatusEnum.Yfirlestur:
        return theme.color.mint600
      case CaseStatusEnum.Tilbúið:
        return theme.color.roseTinted400
      default:
        return theme.color.black
    }
  }

  if (loading) {
    return (
      <Stack space={1}>
        <SkeletonLoader
          height={30}
          repeat={1}
          space={1}
          borderRadius="standard"
        />
        <Inline align="center">
          <SkeletonLoader borderRadius="full" height={184} width={184} />
        </Inline>
        <SkeletonLoader
          height={30}
          repeat={5}
          space={1}
          borderRadius="standard"
        />
      </Stack>
    )
  }

  if (!data || data.total === 0)
    return (
      <Box className={styles.statisticsEmpty}>
        <Box
          component="img"
          src="/assets/empty-lamp-image.svg"
          marginBottom={3}
        />
        <Text marginBottom={1} variant="h3">
          {formatMessage(messages.general.emptyTitle)}
        </Text>
        <Text>{formatMessage(messages.general.emptyIntro)}</Text>
      </Box>
    )

  const pieData = Object.entries(data.statuses).map(([_, value]) => ({
    name: value.title,
    value: value.count,
    percentage: value.percentage,
    fill: mapTitleToColor(value.title),
  }))

  return (
    <Box>
      <Text>{formatMessage(messages.general.intro)}</Text>
      <Box className={styles.statisticsWrapper}>
        <PieChart width={PIE_CHART_DIMENSION} height={PIE_CHART_DIMENSION}>
          <Pie
            innerRadius={50}
            activeShape={{}}
            data={pieData}
            dataKey="value"
          />
        </PieChart>
      </Box>
      <T.Table>
        <T.Body>
          {pieData.map((item, index) => (
            <T.Row key={index}>
              <T.Data
                align="left"
                style={{
                  paddingBlock: theme.spacing[1],
                  paddingInlineStart: theme.spacing[1],
                }}
              >
                <Box display="flex" alignItems="center" columnGap={2}>
                  <Box
                    className={styles.statisticsIndicator}
                    style={{ backgroundColor: item.fill }}
                  />
                  <Text variant="medium">{item.name}</Text>
                </Box>
              </T.Data>
              <T.Data align="center" style={{ paddingBlock: theme.spacing[1] }}>
                <Text variant="medium">{item.value}</Text>
              </T.Data>
              <T.Data align="center" style={{ paddingBlock: theme.spacing[1] }}>
                <Text variant="medium"> {toFixed(item.percentage, 1)}%</Text>
              </T.Data>
            </T.Row>
          ))}
          <T.Row>
            <T.Data
              align="left"
              style={{
                paddingBlock: theme.spacing[1],
                paddingInlineStart: theme.spacing[1],
              }}
            >
              <Box display="flex" alignItems="center" columnGap={2}>
                <Box
                  className={styles.statisticsIndicator}
                  style={{ backgroundColor: 'transparent' }}
                />
                <Text fontWeight="medium" variant="medium">
                  {formatMessage(messages.general.total)}
                </Text>
              </Box>
            </T.Data>
            <T.Data align="center" style={{ paddingBlock: theme.spacing[1] }}>
              <Text fontWeight="medium" variant="medium">
                {data.total}
              </Text>
            </T.Data>
            <T.Data align="center" style={{ paddingBlock: theme.spacing[1] }}>
              <Text fontWeight="medium" variant="medium">
                100%
              </Text>
            </T.Data>
          </T.Row>
        </T.Body>
      </T.Table>
    </Box>
  )
}
