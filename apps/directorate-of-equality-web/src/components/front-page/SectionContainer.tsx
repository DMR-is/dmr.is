'use client'

import dynamic from 'next/dynamic'

import { useState } from 'react'

import { theme } from '@dmr.is/island-ui-theme'
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
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useSuspenseQuery } from '@tanstack/react-query'

const PieChart = dynamic(
  () =>
    import('@dmr.is/ui-lazy/components/PieChart/PieChart').then(
      (mod) => mod.PieChart,
    ),
  { ssr: false },
)

const STATUS_LABELS: Record<ReportStatusEnum, string> = {
  [ReportStatusEnum.DRAFT]: 'Drög',
  [ReportStatusEnum.SUBMITTED]: 'Ný mál',
  [ReportStatusEnum.IN_REVIEW]: 'Í vinnslu',
  [ReportStatusEnum.APPROVED]: 'Samþykkt',
  [ReportStatusEnum.DENIED]: 'Hafnað',
  [ReportStatusEnum.SUPERSEDED]: 'Yfirtekið',
}

const STATUS_COLORS: Record<ReportStatusEnum, string> = {
  [ReportStatusEnum.DRAFT]: theme.color.dark200,
  [ReportStatusEnum.SUBMITTED]: theme.color.yellow600,
  [ReportStatusEnum.IN_REVIEW]: theme.color.roseTinted400,
  [ReportStatusEnum.APPROVED]: theme.color.mint600,
  [ReportStatusEnum.DENIED]: theme.color.red400,
  [ReportStatusEnum.SUPERSEDED]: theme.color.blueberry400,
}

type StatisticsWindow = 'last30Days' | 'currentYear' | 'allTime'

const STATS_WINDOWS: {
  id: StatisticsWindow
  label: string
  variant: 'blue' | 'mint' | 'purple'
}[] = [
  { id: 'last30Days', label: 'Síðustu 30 dagar', variant: 'blue' },
  { id: 'currentYear', label: 'Þetta ár', variant: 'mint' },
  { id: 'allTime', label: 'Allt saman', variant: 'purple' },
]

const STATS_WINDOW_INTROS: Record<StatisticsWindow, string> = {
  last30Days: 'Hlutfall mála eftir stöðu síðustu 30 daga.',
  currentYear: 'Hlutfall mála eftir stöðu á þessu ári.',
  allTime: 'Hlutfall mála eftir stöðu frá upphafi.',
}

const CHART_STATUSES = [
  ReportStatusEnum.SUBMITTED,
  ReportStatusEnum.IN_REVIEW,
  ReportStatusEnum.APPROVED,
  ReportStatusEnum.DENIED,
  ReportStatusEnum.SUPERSEDED,
] as const

export const SectionContainer = () => {
  const [selectedTab, setSelectedTab] = useState('almennt')
  const [statsWindow, setStatsWindow] = useState<StatisticsWindow>('last30Days')

  const trpc = useTRPC()
  const { data: overview } = useSuspenseQuery(
    trpc.reports.overview.queryOptions(),
  )
  const { data: statistics } = useSuspenseQuery(
    trpc.reports.overviewStatistics.queryOptions(),
  )

  const windowItems = statistics[statsWindow].items
  const pieItems = CHART_STATUSES.map((status) => {
    const match = windowItems.find((i) => i.status === status)
    return {
      color: STATUS_COLORS[status],
      title: STATUS_LABELS[status],
      count: match?.count ?? 0,
      percentage: match?.percentage ?? 0,
    }
  })

  return (
    <Section bleed variant="blue">
      <GridContainer>
        <Text variant="h3" fontWeight="semiBold" marginBottom={3}>
          Staða mála
        </Text>
        <GridRow>
          <GridColumn span={['12/12', '7/12']}>
            <Stack space={3}>
              {/* TODO NAVIGATE CORRECTLY AND PREFILTERED FOR MIN MAL */}
              <Wrapper title="Mál" link="/mal" linkText="Opna ristjórn">
                <Tabs
                  label="Mál flokkar"
                  selected={selectedTab}
                  onChange={setSelectedTab}
                  contentBackground="white"
                  tabs={[
                    {
                      id: 'almennt',
                      label: 'Almennt',
                      content: (
                        <TrackerTable
                          rows={[
                            {
                              text: `${overview.general.submittedToday} ný mál hafa borist í dag`,
                            },
                            {
                              text: `${overview.general.inProgress} mál eru til skoðunar hjá starfsmönnum`,
                            },
                            {
                              text: `${overview.general.reportsWithComments} opin mál eru með skráðar athugasemdir`,
                            },
                            {
                              text: `${overview.general.reportsWithoutEmployee} opin mál eru án úthlutaðs starfsmanns`,
                            },
                          ]}
                        />
                      ),
                    },
                    {
                      id: 'min-mal',
                      label: 'Mín mál',
                      content: (
                        <TrackerTable
                          rows={[
                            {
                              text: `${overview.assigned.totalAssigned} opin mál eru úthlutað til mín`,
                            },
                            {
                              text: `${overview.assigned.assignedWithComments} af mínum málum eru með skráðar athugasemdir`,
                            },
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              </Wrapper>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '5/12']}>
            <Wrapper title="Tölfræði">
              <Box display="flex" flexWrap="wrap" columnGap={1} rowGap={1} marginBottom={2}>
                {STATS_WINDOWS.map(({ id, label, variant }) => (
                  <Tag
                    key={id}
                    variant={variant}
                    outlined={statsWindow !== id}
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
            </Wrapper>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
