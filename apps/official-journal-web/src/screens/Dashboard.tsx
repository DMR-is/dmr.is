import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Tabs,
  Text,
} from '@island.is/island-ui/core'
import { AdvertsOverviewList } from '../components/adverts-overview-list/AdvertsOverviewList'
import { Banner } from '../components/banner/Banner'
import { ContentWrapper } from '../components/content-wrapper/ContentWrapper'
import { ImageWithText } from '../components/image-with-text/ImageWithText'
import { StatisticsNotPublished } from '../components/statistics/NotPublished'
import { Section } from '../components/section/Section'
import { messages } from '../lib/messages'
import { Screen } from '../lib/types'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'

type StatisticsData = {
  totalAdverts: number
  categories: {
    text: string
    totalAdverts: number
  }[]
}

type Props = {
  statistics: {
    general: StatisticsData | null
    personal: StatisticsData | null
    inactive: StatisticsData | null
    publishing: StatisticsData | null
  }
}

const Dashboard: Screen<Props> = ({ statistics }) => {
  const ritstjornTabs = [
    {
      id: 'ritstjorn-almennt',
      label: messages.components.tabs.editorial.title,
      content: (
        <Box background="white" paddingTop={3}>
          <AdvertsOverviewList data={statistics.general} variant="default" />
        </Box>
      ),
    },
    {
      id: 'ritstjorn-min-mal',
      label: messages.components.tabs.assigned.title,
      content: (
        <Box background="white" paddingTop={3}>
          <AdvertsOverviewList data={statistics.personal} variant="assigned" />
        </Box>
      ),
    },
    {
      id: 'ritstjorn-ohreyfd-mal',
      label: messages.components.tabs.inactive.title,
      content: (
        <Box background="white" paddingTop={3}>
          <AdvertsOverviewList data={statistics.inactive} variant="inactive" />
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
    <>
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
                  <AdvertsOverviewList
                    data={statistics.publishing}
                    variant="readyForPublishing"
                  />
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
      <Section>
        <ImageWithText
          title={messages.components.image_with_text.new_adverts.title}
          image="/assets/image-with-text-1.svg"
          linkText={messages.components.image_with_text.new_adverts.linkText}
          link="#"
          linkIcon="open"
          linkIconType="outline"
        >
          <Text variant="intro">
            {messages.components.image_with_text.print_version.description}
          </Text>
        </ImageWithText>
        <ImageWithText
          title={messages.components.image_with_text.print_version.title}
          image="/assets/image-with-text-2.svg"
          linkText={messages.components.image_with_text.print_version.linkText}
          link="#"
          linkIcon="arrowForward"
          linkIconType="outline"
          align="rtl"
        >
          <Text variant="intro">
            {messages.components.image_with_text.print_version.description}
          </Text>
        </ImageWithText>
      </Section>
    </>
  )
}

Dashboard.getProps = async () => {
  const dmrClient = createDmrClient()

  const [general, personal, inactive, publishing] = await Promise.all(
    [
      dmrClient.statisticsControllerOverview({
        type: 'general',
      }),
      dmrClient.statisticsControllerOverview({
        type: 'personal',
      }),
      dmrClient.statisticsControllerOverview({
        type: 'inactive',
      }),
      dmrClient.statisticsControllerOverview({
        type: 'publishing',
      }),
    ].map((promise) => promise.catch(() => null)),
  )

  const statistics = {
    general,
    personal,
    inactive,
    publishing,
  }

  return {
    statistics,
  }
}

const mockBannerCards = [
  {
    title: messages.components.frontpageBanner.cards.editorial.title,
    text: messages.components.frontpageBanner.cards.editorial.description,
    link: '/ritstjorn',
    image: '/assets/ritstjorn-image.svg',
  },
  {
    title: messages.components.frontpageBanner.cards.publishing.title,
    text: messages.components.frontpageBanner.cards.publishing.description,
    link: '/ritstjorn',
    image: '/assets/utgafa-image.svg',
  },
  {
    title: messages.components.frontpageBanner.cards.all.title,
    text: messages.components.frontpageBanner.cards.all.description,
    link: '/ritstjorn',
    image: '/assets/heildar-image.svg',
  },
]

export default withMainLayout(Dashboard, {
  showFooter: true,
  bannerProps: {
    showBanner: true,
    cards: mockBannerCards,
    description: messages.components.frontpageBanner.description,
    title: messages.components.frontpageBanner.title,
    imgSrc: '/assets/banner-image.svg',
  },
})
