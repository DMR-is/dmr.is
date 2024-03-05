import { Layout } from '../components/layout/Layout'
import { Banner } from '../components/banner/Banner'
import { Section } from '../components/section/Section'
import {
  GridColumn,
  GridContainer,
  GridRow,
  Text,
  Box,
  Tabs,
} from '@island.is/island-ui/core'
import { ContentWrapper } from '../components/content-wrapper/ContentWrapper'
import { AdvertsOverviewList } from '../components/adverts-overview-list/AdvertsOverviewList'
import { messages } from '../lib/messages'
import { StatisticsNotPublished } from '../components/statistics/NotPublished'
export default function HomePage() {
  const ritstjornTabs = [
    {
      id: 'ritstjorn-almennt',
      label: messages.components.tabs.editorial.title,
      content: (
        <Box background="white" paddingTop={3}>
          <AdvertsOverviewList variant="default" />
        </Box>
      ),
    },
    {
      id: 'ritstjorn-min-mal',
      label: messages.components.tabs.assigned.title,
      content: (
        <Box background="white" paddingTop={3}>
          <AdvertsOverviewList variant="assigned" />
        </Box>
      ),
    },
    {
      id: 'ritstjorn-ohreyfd-mal',
      label: messages.components.tabs.inactive.title,
      content: (
        <Box background="white" paddingTop={3}>
          <AdvertsOverviewList variant="inactive" />
        </Box>
      ),
    },
  ]

  const statisticsTabs = [
    {
      id: 'statistics-not-published-a',
      label: messages.general.advert_departments.a,
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsNotPublished department="a" />
        </Box>
      ),
    },
    {
      id: 'statistics-not-published-b',
      label: messages.general.advert_departments.b,
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsNotPublished department="b" />
        </Box>
      ),
    },
    {
      id: 'statistics-not-published-c',
      label: messages.general.advert_departments.c,
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsNotPublished department="c" />
        </Box>
      ),
    },
  ]

  return (
    <Layout>
      <Banner />
      <Section variant="blue">
        <GridContainer>
          <GridRow>
            <GridColumn span="1/1">
              <Text variant="h3" marginBottom={3}>
                {messages.general.advert_statuses}
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
                  title={messages.general.editorial}
                  link="#"
                  linkText={
                    messages.components.adverts_overview_list.editorial.linkText
                  }
                >
                  <Tabs
                    selected={ritstjornTabs[0].id}
                    size="sm"
                    label={messages.components.tabs.label}
                    tabs={ritstjornTabs}
                  />
                </ContentWrapper>
                <ContentWrapper
                  title={messages.general.publishing}
                  link="#"
                  linkText={
                    messages.components.adverts_overview_list.publishing
                      .linkText
                  }
                >
                  <AdvertsOverviewList variant="readyForPublishing" />
                </ContentWrapper>
              </Box>
            </GridColumn>
            <GridColumn span={['1/1', '1/1', '5/12']}>
              <ContentWrapper
                title={messages.general.statistics}
                link="#"
                linkText={messages.components.statistics.linkText}
              >
                <Tabs
                  selected={statisticsTabs[0].id}
                  size="sm"
                  label={messages.components.tabs.label}
                  tabs={statisticsTabs}
                />
              </ContentWrapper>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
      <Section></Section>
    </Layout>
  )
}
