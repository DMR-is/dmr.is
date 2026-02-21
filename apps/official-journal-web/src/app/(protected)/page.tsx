'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import type { TabType } from '@island.is/island-ui/core/Tabs/Tabs'

import { CasesOverviewList } from '../../components/cases-overview-list/CasesOverviewList'
import { ContentWrapper } from '../../components/content-wrapper/ContentWrapper'
import { ImageWithText } from '../../components/image-with-text/ImageWithText'
import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { StatisticsPieCharts } from '../../components/statistics/PieCharts'
import {
  DepartmentSlugEnum,
  StatisticsOverviewQueryType,
} from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/dashboard'
import { useTRPC } from '../../lib/trpc/client/trpc'

export default function Dashboard() {
  const { formatMessage } = useFormatMessage()
  const trpc = useTRPC()

  const [departmentTab, setDepartmentTab] = useState(DepartmentSlugEnum.ADeild)

  const [overviewTab, setOverviewTab] = useState<StatisticsOverviewQueryType>(
    StatisticsOverviewQueryType.General,
  )

  const { data: departmentStatistics, isLoading: isLoadingDepartmentStatistics } =
    useQuery(
      trpc.getStatisticsForDepartment.queryOptions({
        slug: departmentTab,
      }),
    )

  const { data: overviewDashboard } = useQuery(
    trpc.getStatisticsOverviewDashboard.queryOptions(),
  )

  const overViewDashboardData = Object.fromEntries(
    overviewDashboard?.items.map((item) => [
      item.overviewType,
      item.overview,
    ]) ?? [],
  )

  const statisticsTabs: TabType[] = [
    {
      id: DepartmentSlugEnum.ADeild,
      label: formatMessage(messages.tabs.statistics.a),
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsPieCharts
            data={departmentStatistics}
            loading={isLoadingDepartmentStatistics}
          />
        </Box>
      ),
    },
    {
      id: DepartmentSlugEnum.BDeild,
      label: formatMessage(messages.tabs.statistics.b),
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsPieCharts
            data={departmentStatistics}
            loading={isLoadingDepartmentStatistics}
          />
        </Box>
      ),
    },
    {
      id: DepartmentSlugEnum.CDeild,
      label: formatMessage(messages.tabs.statistics.c),
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsPieCharts
            data={departmentStatistics}
            loading={isLoadingDepartmentStatistics}
          />
        </Box>
      ),
    },
  ]

  const ritstjornTabs = [
    {
      id: StatisticsOverviewQueryType.General,
      label: formatMessage(messages.tabs.admin.general),
      content: (
        <Box background="white" paddingTop={3}>
          <CasesOverviewList
            data={overViewDashboardData[StatisticsOverviewQueryType.General]}
            variant="default"
          />
        </Box>
      ),
    },
    {
      id: StatisticsOverviewQueryType.Personal,
      label: formatMessage(messages.tabs.admin.personal),
      content: (
        <Box background="white" paddingTop={3}>
          <CasesOverviewList
            data={overViewDashboardData[StatisticsOverviewQueryType.Personal]}
            variant="assigned"
          />
        </Box>
      ),
    },
    {
      id: StatisticsOverviewQueryType.Inactive,
      label: formatMessage(messages.tabs.admin.inactive),
      content: (
        <Box background="white" paddingTop={3}>
          <CasesOverviewList
            data={overViewDashboardData[StatisticsOverviewQueryType.Inactive]}
            variant="inactive"
          />
        </Box>
      ),
    },
  ]

  return (
    <>
      <Meta title={formatMessage(messages.banner.content.title)} />
      <Section bleed={true} variant="blue">
        <GridContainer>
          <GridRow>
            <GridColumn span="1/1">
              <Text variant="h3" as="h2" marginBottom={3}>
                {formatMessage(messages.general.caseStatuses)}
              </Text>
            </GridColumn>
          </GridRow>
          <GridRow rowGap={3}>
            <GridColumn span={['1/1', '1/1', '7/12']}>
              <Box
                display="flex"
                flexDirection="column"
                rowGap={3}
                flexWrap="wrap"
              >
                <ContentWrapper
                  title={messages.general.admin}
                  link={Routes.ProcessingOverview}
                  linkText={messages.general.openAdmin}
                >
                  <Tabs
                    label={formatMessage(messages.general.caseStatuses)}
                    selected={overviewTab}
                    onChange={(id) =>
                      setOverviewTab(id as StatisticsOverviewQueryType)
                    }
                    size="sm"
                    tabs={ritstjornTabs}
                  />
                </ContentWrapper>
                <ContentWrapper
                  title={messages.general.publishing}
                  link={Routes.PublishingOverview}
                  linkText={messages.general.openPublishing}
                >
                  <CasesOverviewList
                    data={
                      overViewDashboardData[
                        StatisticsOverviewQueryType.Publishing
                      ]
                    }
                    variant="readyForPublishing"
                  />
                </ContentWrapper>
              </Box>
            </GridColumn>
            <GridColumn span={['1/1', '1/1', '5/12']}>
              <ContentWrapper
                title={messages.general.statistics}
                linkText={messages.general.openStatistics}
              >
                <Tabs
                  label={formatMessage(messages.general.statistics)}
                  selected={departmentTab}
                  onChange={(id) => setDepartmentTab(id as DepartmentSlugEnum)}
                  size="sm"
                  tabs={statisticsTabs}
                />
              </ContentWrapper>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
      <Section>
        <ImageWithText
          kicker="Stjórnartíðindi"
          title={formatMessage(messages.imageWithText.new.title)}
          image="/assets/image-with-text-1.svg"
          linkText={formatMessage(messages.imageWithText.new.linkText)}
          linkIcon="open"
          linkIconType="outline"
          intro={formatMessage(messages.imageWithText.new.description)}
          text={formatMessage(messages.imageWithText.new.text)}
          link={Routes.ProcessingOverview}
        />
      </Section>
    </>
  )
}
