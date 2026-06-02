'use client'

import dynamic from 'next/dynamic'

import { useState } from 'react'

import { theme } from '@dmr.is/island-ui-theme'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Section } from '@dmr.is/ui/components/Section/Section'
import { TrackerTable } from '@dmr.is/ui/components/Tables/TrackerTable'
import { Wrapper } from '@dmr.is/ui/components/Wrapper/Wrapper'

import { ReportStatusEnum } from '../../gen/fetch/types.gen'
import { frontPageText, overviewText, serverErrorText, sharedText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

const PieChart = dynamic(
  () =>
    import('@dmr.is/ui-lazy/components/PieChart/PieChart').then(
      (mod) => mod.PieChart,
    ),
  { ssr: false },
)

const STATUS_LABELS: Record<ReportStatusEnum, string> = {
  [ReportStatusEnum.DRAFT]: sharedText.statusLabels.DRAFT,
  [ReportStatusEnum.SUBMITTED]: sharedText.statusLabels.SUBMITTED,
  [ReportStatusEnum.POSTPONED]: sharedText.statusLabels.POSTPONED,
  [ReportStatusEnum.IN_REVIEW]: sharedText.statusLabels.IN_REVIEW,
  [ReportStatusEnum.APPROVED]: sharedText.statusLabels.APPROVED,
  [ReportStatusEnum.DENIED]: sharedText.statusLabels.DENIED,
  [ReportStatusEnum.SUPERSEDED]: sharedText.statusLabels.SUPERSEDED,
  [ReportStatusEnum.WITHDRAWN]: sharedText.statusLabels.WITHDRAWN,
}

const STATUS_COLORS: Record<ReportStatusEnum, string> = {
  [ReportStatusEnum.DRAFT]: theme.color.dark200,
  [ReportStatusEnum.SUBMITTED]: theme.color.yellow600,
  [ReportStatusEnum.POSTPONED]: theme.color.blue200,
  [ReportStatusEnum.IN_REVIEW]: theme.color.roseTinted400,
  [ReportStatusEnum.APPROVED]: theme.color.mint600,
  [ReportStatusEnum.DENIED]: theme.color.red400,
  [ReportStatusEnum.SUPERSEDED]: theme.color.blueberry400,
  [ReportStatusEnum.WITHDRAWN]: theme.color.dark300,
}

type StatisticsWindow = 'last30Days' | 'currentYear' | 'allTime'

const STATS_WINDOWS: {
  id: StatisticsWindow
  label: string
  variant: 'blue' | 'mint' | 'purple'
}[] = [
  {
    id: 'last30Days',
    label: frontPageText.statsWindows.last30,
    variant: 'blue',
  },
  {
    id: 'currentYear',
    label: frontPageText.statsWindows.thisYear,
    variant: 'blue',
  },
  {
    id: 'allTime',
    label: frontPageText.statsWindows.allTime,
    variant: 'blue',
  },
]

const STATS_WINDOW_INTROS: Record<StatisticsWindow, string> = {
  last30Days: frontPageText.statsIntros.last30,
  currentYear: frontPageText.statsIntros.thisYear,
  allTime: frontPageText.statsIntros.allTime,
}

const CHART_STATUSES = [
  ReportStatusEnum.SUBMITTED,
  ReportStatusEnum.IN_REVIEW,
  ReportStatusEnum.APPROVED,
  ReportStatusEnum.DENIED,
  ReportStatusEnum.SUPERSEDED,
] as const

type Props = {
  userId?: string
}

export const SectionContainer = ({ userId }: Props) => {
  const [selectedTab, setSelectedTab] = useState('almennt')
  const [statsWindow, setStatsWindow] = useState<StatisticsWindow>('last30Days')

  const trpc = useTRPC()
  const { data: overview, isError: overviewError } = useQuery(
    trpc.reports.overview.queryOptions(),
  )
  const { data: statistics, isError: statisticsError } = useQuery(
    trpc.reports.overviewStatistics.queryOptions(),
  )

  const pieItems = statistics
    ? CHART_STATUSES.map((status) => {
        const match = statistics[statsWindow].items.find(
          (i) => i.status === status,
        )
        return {
          color: STATUS_COLORS[status],
          title: STATUS_LABELS[status],
          count: match?.count ?? 0,
          percentage: match?.percentage ?? 0,
        }
      })
    : []

  return (
    <Section bleed variant="blue">
      <GridContainer>
        <Text variant="h3" fontWeight="semiBold" marginBottom={3}>
          {frontPageText.sectionTitle}
        </Text>
        <GridRow>
          <GridColumn span={['12/12', '7/12']}>
            <Stack space={3}>
              <Wrapper
                title={overviewText.heroTitle}
                link={
                  selectedTab === 'min-mal'
                    ? `/yfirlit?tab=i-vinnslu${userId ? `&reviewerUserId=${userId}` : ''}`
                    : '/yfirlit'
                }
                linkText={overviewText.openAdmin}
              >
                {overviewError ? (
                  <AlertMessage
                    type="error"
                    title={serverErrorText.title}
                    message={serverErrorText.message}
                  />
                ) : (
                  <Tabs
                    label="Mál flokkar"
                    selected={selectedTab}
                    onChange={setSelectedTab}
                    contentBackground="white"
                    tabs={[
                      {
                        id: 'almennt',
                        label: frontPageText.tabGeneral,
                        content: (
                          <TrackerTable
                            rows={[
                              {
                                text: `${overview?.general.submittedToday ?? 0} ný mál hafa borist í dag`,
                              },
                              {
                                text: `${overview?.general.inProgress ?? 0} mál eru til skoðunar hjá starfsmönnum`,
                              },
                              {
                                text: `${overview?.general.reportsWithComments ?? 0} opin mál eru með skráðar athugasemdir`,
                              },
                              {
                                text: `${overview?.general.reportsWithoutEmployee ?? 0} opin mál eru án úthlutaðs starfsmanns`,
                              },
                            ]}
                          />
                        ),
                      },
                      {
                        id: 'min-mal',
                        label: frontPageText.tabMine,
                        content: (
                          <TrackerTable
                            rows={[
                              {
                                text: `${overview?.assigned.totalAssigned ?? 0} opin mál eru úthlutað til mín`,
                              },
                              {
                                text: `${overview?.assigned.assignedWithComments ?? 0} af mínum málum eru með skráðar athugasemdir`,
                              },
                            ]}
                          />
                        ),
                      },
                    ]}
                  />
                )}
              </Wrapper>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '5/12']}>
            <Wrapper title={frontPageText.statsTitle}>
              {statisticsError ? (
                <AlertMessage
                  type="error"
                  title={serverErrorText.title}
                  message={serverErrorText.message}
                />
              ) : (
                <>
                  <Box
                    display="flex"
                    flexWrap="wrap"
                    columnGap={1}
                    rowGap={1}
                    marginBottom={2}
                  >
                    {STATS_WINDOWS.map(({ id, label, variant }) => (
                      <Tag
                        key={id}
                        active={statsWindow === id}
                        variant={variant}
                        onClick={() => setStatsWindow(id)}
                      >
                        {label}
                      </Tag>
                    ))}
                  </Box>
                  <PieChart
                    intro={STATS_WINDOW_INTROS[statsWindow]}
                    items={pieItems}
                  />
                </>
              )}
            </Wrapper>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
