'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Footer } from '@dmr.is/ui/components/island-is/Footer'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Banner } from '../../components/banner/Banner'
import { CasesOverviewList } from '../../components/cases-overview-list/CasesOverviewList'
import { ContentWrapper } from '../../components/content-wrapper/ContentWrapper'
import { ImageWithText } from '../../components/image-with-text/ImageWithText'
import { Meta } from '../../components/meta/Meta'
import { Section } from '../../components/section/Section'
import { StatisticsContainer } from '../../components/statistics/StatisticsContainer'
import { StatisticsOverviewQueryType } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/dashboard'
import { useTRPC } from '../../lib/trpc/client/trpc'

export default function Dashboard() {
  const { formatMessage } = useFormatMessage()
  const trpc = useTRPC()

  const [overviewTab, setOverviewTab] = useState<StatisticsOverviewQueryType>(
    StatisticsOverviewQueryType.General,
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
      <Banner
        title={messages.banner.content.title}
        description={messages.banner.content.description}
        imgSrc="/assets/banner-image.svg"
        cards={[
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
        ]}
      />
      <Section bleed={true}>
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
              <StatisticsContainer />
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
      <Footer />
    </>
  )
}
