import dynamic from 'next/dynamic'
import { Pie } from 'recharts'

import { Box, Table as T, Text } from '@island.is/island-ui/core'
import { theme } from '@island.is/island-ui/theme'

import { useMockStatisticsNotPublished } from '../../hooks/useMockStatisticsNotPublished'
import { PIE_CHART_DIMENSION } from '../../lib/constants'
import { messages } from '../../lib/messages'
import * as styles from './Statistics.css'

type Props = {
  department: 'a' | 'b' | 'c'
}

const PieChart = dynamic(
  () => import('recharts').then((recharts) => recharts.PieChart),
  { ssr: false },
)

export const StatisticsNotPublished = ({ department }: Props) => {
  const { data, total } = useMockStatisticsNotPublished(department)

  const mapTitleToColor = (title: string) => {
    switch (title) {
      case 'Innsendingar':
        return theme.color.dark400
      case 'Grunnvinnsla':
        return theme.color.blue400
      case 'Yfirlestur':
        return theme.color.mint600
      case 'Tilbúið':
        return theme.color.roseTinted400
      default:
        return theme.color.black
    }
  }

  if (!total.count)
    return (
      <Box className={styles.statisticsEmpty}>
        <Box
          component="img"
          src="/assets/empty-lamp-image.svg"
          marginBottom={3}
        />
        <Text marginBottom={1} variant="h3">
          {messages.components.statistics.emptyTitle}
        </Text>
        <Text>{messages.components.statistics.emptyIntro}</Text>
      </Box>
    )

  const pieData = Object.entries(data).map((item) => ({
    name: item[1].title,
    value: item[1].count,
    percentage: item[1].percentage,
    fill: mapTitleToColor(item[1].title),
  }))

  return (
    <Box>
      <Text>{messages.components.statistics.intro}</Text>
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
                <Text variant="medium"> {item.percentage}%</Text>
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
                  {messages.components.statistics.total}
                </Text>
              </Box>
            </T.Data>
            <T.Data align="center" style={{ paddingBlock: theme.spacing[1] }}>
              <Text fontWeight="medium" variant="medium">
                {total.count}
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
