import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { useState } from 'react'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Tabs,
  TabType,
  Text,
} from '@island.is/island-ui/core'

import { CasesOverviewList } from '../components/cases-overview-list/CasesOverviewList'
import { ContentWrapper } from '../components/content-wrapper/ContentWrapper'
import { ImageWithText } from '../components/image-with-text/ImageWithText'
import { Meta } from '../components/meta/Meta'
import { Section } from '../components/section/Section'
import { StatisticsPieCharts } from '../components/statistics/PieCharts'
import { StatisticsOverviewQueryType } from '../gen/fetch'
import { useStatistics } from '../hooks/api'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { LayoutProps } from '../layout/Layout'
import { Routes } from '../lib/constants'
import { messages } from '../lib/messages/dashboard'
import { deleteUndefined, loginRedirect } from '../lib/utils'
import { authOptions } from './api/auth/[...nextauth]'

export default function Dashboard() {
  const { formatMessage } = useFormatMessage()

  const [departmentTab, setDepartmentTab] = useState('a-deild')

  const [overviewTab, setOverviewTab] = useState<StatisticsOverviewQueryType>(
    StatisticsOverviewQueryType.General,
  )

  const {
    departmentStatistics,
    isLoadingDepartmentStatistics,
    overViewDashboardData,
  } = useStatistics({
    departmentParams: {
      slug: departmentTab,
    },
  })

  const statisticsTabs: TabType[] = [
    {
      id: 'a-deild',
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
      id: 'b-deild',
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
      id: 'c-deild',
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
                  onChange={(id) => setDepartmentTab(id)}
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

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  resolvedUrl,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const mockBannerCards = [
    {
      title: messages.banner.cards.editorial.title,
      text: messages.banner.cards.editorial.description,
      link: Routes.ProcessingOverview,
      image: '/assets/ritstjorn-image.svg',
    },
    {
      title: messages.banner.cards.publishing.title,
      text: messages.banner.cards.publishing.description,
      link: Routes.PublishingOverview,
      image: '/assets/utgafa-image.svg',
    },
    {
      title: messages.banner.cards.all.title,
      text: messages.banner.cards.all.description,
      link: Routes.Overview,
      image: '/assets/heildar-image.svg',
    },
  ]

  const layout: LayoutProps = {
    showFooter: true,
    bannerProps: {
      showBanner: true,
      cards: mockBannerCards,
      description: messages.banner.content.description,
      title: messages.banner.content.title,
      imgSrc: '/assets/banner-image.svg',
    },
  }

  return {
    props: deleteUndefined({
      session,
      layout,
    }),
  }
}
