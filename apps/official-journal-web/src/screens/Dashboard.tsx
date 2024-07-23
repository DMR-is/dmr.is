import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Tabs,
  TabType,
  Text,
} from '@island.is/island-ui/core'

import { AdvertsOverviewList } from '../components/adverts-overview-list/AdvertsOverviewList'
import { ContentWrapper } from '../components/content-wrapper/ContentWrapper'
import { ImageWithText } from '../components/image-with-text/ImageWithText'
import { Meta } from '../components/meta/Meta'
import { Section } from '../components/section/Section'
import { StatisticsNotPublished } from '../components/statistics/NotPublished'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { Routes } from '../lib/constants'
import { messages } from '../lib/messages/dashboard'
import { Screen } from '../lib/types'
import { ARMANN } from '../lib/userMock'

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
  const { formatMessage } = useFormatMessage()

  const ritstjornTabs: TabType[] = [
    {
      id: 'ritstjorn-almennt',
      label: formatMessage(messages.tabs.admin.general),
      content: (
        <Box background="white" paddingTop={3}>
          <AdvertsOverviewList data={statistics.general} variant="default" />
        </Box>
      ),
    },
    {
      id: 'ritstjorn-min-mal',
      label: formatMessage(messages.tabs.admin.personal),
      content: (
        <Box background="white" paddingTop={3}>
          <AdvertsOverviewList data={statistics.personal} variant="assigned" />
        </Box>
      ),
    },
    {
      id: 'ritstjorn-ohreyfd-mal',
      label: formatMessage(messages.tabs.admin.inactive),
      content: (
        <Box background="white" paddingTop={3}>
          <AdvertsOverviewList data={statistics.inactive} variant="inactive" />
        </Box>
      ),
    },
  ]

  const statisticsTabs: TabType[] = [
    {
      id: 'statistics-not-published-a',
      label: formatMessage(messages.tabs.statistics.a),
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsNotPublished department="a" />
        </Box>
      ),
    },
    {
      id: 'statistics-not-published-b',
      label: formatMessage(messages.tabs.statistics.b),
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsNotPublished department="b" />
        </Box>
      ),
    },
    {
      id: 'statistics-not-published-c',
      label: formatMessage(messages.tabs.statistics.c),
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsNotPublished department="c" />
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
                    selected={ritstjornTabs[0].id}
                    size="sm"
                    tabs={ritstjornTabs}
                  />
                </ContentWrapper>
                <ContentWrapper
                  title={messages.general.publishing}
                  link={Routes.PublishingOverview}
                  linkText={messages.general.openPublishing}
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
                linkText={messages.general.openStatistics}
              >
                <Tabs
                  label={formatMessage(messages.general.statistics)}
                  selected={statisticsTabs[0].id}
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
          link="#"
          linkIcon="open"
          linkIconType="outline"
          intro={formatMessage(messages.imageWithText.new.description)}
          text={formatMessage(messages.imageWithText.new.text)}
        />
        <ImageWithText
          kicker="Stjórnartíðindi"
          title={formatMessage(messages.imageWithText.print.title)}
          image="/assets/image-with-text-2.svg"
          linkText={formatMessage(messages.imageWithText.print.linkText)}
          link="#"
          linkIcon="arrowForward"
          linkIconType="outline"
          align="rtl"
          intro={formatMessage(messages.imageWithText.print.description)}
        />
      </Section>
    </>
  )
}

Dashboard.getProps = async () => {
  const dmrClient = createDmrClient()
  const user = ARMANN

  const [general, personal, inactive, publishing] = await Promise.all(
    [
      dmrClient.statisticsControllerOverview({
        type: 'general',
      }),
      dmrClient.statisticsControllerOverview({
        type: 'personal',
        userId: user.id,
      }),
      dmrClient.statisticsControllerOverview({
        type: 'inactive',
      }),
      dmrClient.statisticsControllerOverview({
        type: 'publishing',
      }),
    ].map((promise) =>
      promise.catch((err) => {
        console.error(err)
        return null
      }),
    ),
  )

  return {
    statistics: {
      general,
      personal,
      inactive,
      publishing,
    },
  }
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

export default withMainLayout(Dashboard, {
  showFooter: true,
  bannerProps: {
    showBanner: true,
    cards: mockBannerCards,
    description: messages.banner.content.description,
    title: messages.banner.content.title,
    imgSrc: '/assets/banner-image.svg',
  },
})
