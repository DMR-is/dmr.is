import dynamic from 'next/dynamic'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tabs, type TabType } from '@dmr.is/ui/components/island-is/Tabs'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { theme } from '@island.is/island-ui/theme'

import {
  CaseStatusEnum,
  DepartmentSlugEnum,
  GetStatisticsDepartmentResponse,
} from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as dashBoardMessages } from '../../lib/messages/dashboard'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { ContentWrapper } from '../content-wrapper/ContentWrapper'
import { messages } from './messages'
import * as styles from './Statistics.css'

const PieChart = dynamic(
  () =>
    import('@dmr.is/ui/lazy/components/PieChart/PieChart').then(
      (piechart) => piechart.PieChart,
    ),
  { ssr: false },
)

const TabContent = ({
  loading,
  data,
}: {
  loading: boolean
  data?: GetStatisticsDepartmentResponse
}) => {
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
  if (!data || data.total === 0) {
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
  }
  const pieData = Object.entries(data?.statuses || {}).map(([_, value]) => ({
    title: value.title,
    count: value.count,
    percentage: value.percentage,
    color: mapTitleToColor(value.title),
  }))

  return (
    <PieChart intro={formatMessage(messages.general.intro)} items={pieData} />
  )
}

export const StatisticsContainer = () => {
  const { formatMessage } = useFormatMessage()
  const trpc = useTRPC()

  const [departmentTab, setDepartmentTab] = useState(DepartmentSlugEnum.ADeild)
  const { data, isLoading: loading } = useQuery(
    trpc.getStatisticsForDepartment.queryOptions({
      slug: departmentTab,
    }),
  )

  const title = formatMessage(dashBoardMessages.general.statistics)
  const linkText = formatMessage(dashBoardMessages.general.openStatistics)
  const tabLabel = formatMessage(dashBoardMessages.general.statistics)

  const statisticsTabs: TabType[] = [
    {
      id: DepartmentSlugEnum.ADeild,
      label: formatMessage(dashBoardMessages.tabs.statistics.a),
      content: (
        <Box background="white" paddingTop={3}>
          <TabContent loading={loading} data={data} />
        </Box>
      ),
    },
    {
      id: DepartmentSlugEnum.BDeild,
      label: formatMessage(dashBoardMessages.tabs.statistics.b),
      content: (
        <Box background="white" paddingTop={3}>
          <TabContent loading={loading} data={data} />
        </Box>
      ),
    },
    {
      id: DepartmentSlugEnum.CDeild,
      label: formatMessage(dashBoardMessages.tabs.statistics.c),
      content: (
        <Box background="white" paddingTop={3}>
          <TabContent loading={loading} data={data} />
        </Box>
      ),
    },
  ]

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
  return (
    <ContentWrapper title={title} linkText={linkText}>
      <Tabs
        label={tabLabel}
        selected={departmentTab}
        onChange={(id) => setDepartmentTab(id as DepartmentSlugEnum)}
        size="sm"
        tabs={statisticsTabs}
      />
    </ContentWrapper>
  )
}
