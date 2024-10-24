import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { Session } from 'next-auth'
import { getSession } from 'next-auth/react'
import { logger } from '@dmr.is/logging'
import { isResponse } from '@dmr.is/utils/client'

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
import {
  GetStatisticsDepartmentResponse,
  GetStatisticsOverviewResponse,
  GetStatisticsOverviewTypeEnum,
} from '../gen/fetch'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { LayoutProps } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { Routes } from '../lib/constants'
import { messages } from '../lib/messages/dashboard'
import { deleteUndefined } from '../lib/utils'

type Props = {
  session: Session
  statisticsOverview: {
    general: GetStatisticsOverviewResponse | null
    personal: GetStatisticsOverviewResponse | null
    inactive: GetStatisticsOverviewResponse | null
    publishing: GetStatisticsOverviewResponse | null
  }
  statisticsByDepartment: {
    a: GetStatisticsDepartmentResponse | null
    b: GetStatisticsDepartmentResponse | null
    c: GetStatisticsDepartmentResponse | null
  }
}

const LOG_CATEGORY = 'dashboard'

export default function Dashboard(
  data: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { statisticsOverview, statisticsByDepartment } = data

  const { formatMessage } = useFormatMessage()

  const ritstjornTabs: TabType[] = [
    {
      id: 'ritstjorn-almennt',
      label: formatMessage(messages.tabs.admin.general),
      content: (
        <Box background="white" paddingTop={3}>
          <CasesOverviewList
            data={statisticsOverview.general}
            variant="default"
          />
        </Box>
      ),
    },
    {
      id: 'ritstjorn-min-mal',
      label: formatMessage(messages.tabs.admin.personal),
      content: (
        <Box background="white" paddingTop={3}>
          <CasesOverviewList
            data={statisticsOverview.personal}
            variant="assigned"
          />
        </Box>
      ),
    },
    {
      id: 'ritstjorn-ohreyfd-mal',
      label: formatMessage(messages.tabs.admin.inactive),
      content: (
        <Box background="white" paddingTop={3}>
          <CasesOverviewList
            data={statisticsOverview.inactive}
            variant="inactive"
          />
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
          <StatisticsPieCharts data={statisticsByDepartment.a} />
        </Box>
      ),
    },
    {
      id: 'statistics-not-published-b',
      label: formatMessage(messages.tabs.statistics.b),
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsPieCharts data={statisticsByDepartment.b} />
        </Box>
      ),
    },
    {
      id: 'statistics-not-published-c',
      label: formatMessage(messages.tabs.statistics.c),
      content: (
        <Box background="white" paddingTop={3}>
          <StatisticsPieCharts data={statisticsByDepartment.c} />
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
                  <CasesOverviewList
                    data={statisticsOverview.publishing}
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

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
}) => {
  const session = await getSession({ req })
  const dmrClient = createDmrClient()

  if (!session) {
    return {
      redirect: {
        destination: Routes.Login,
        permanent: false,
      },
    }
  }

  const [general, personal, inactive, publishing] = await Promise.all(
    [
      dmrClient.getStatisticsOverview({
        type: GetStatisticsOverviewTypeEnum.General,
      }),
      dmrClient.getStatisticsOverview({
        type: GetStatisticsOverviewTypeEnum.Personal,
        userId: session.user.nationalId,
      }),
      dmrClient.getStatisticsOverview({
        type: GetStatisticsOverviewTypeEnum.Inactive,
      }),
      dmrClient.getStatisticsOverview({
        type: GetStatisticsOverviewTypeEnum.Publishing,
      }),
    ].map((promise) =>
      promise.catch(async (err) => {
        if (isResponse(err)) {
          const json = await err.json()
          logger.error(`Error fetching data`, {
            statusCode: json.statusCode,
            message: json.message,
            error: json.error,
            category: LOG_CATEGORY,
          })
        }
        return null
      }),
    ),
  )

  const [aStatistics, bStatistics, cStatistics] = await Promise.all(
    [
      dmrClient.getStatisticsForDepartment({
        slug: 'a-deild',
      }),
      dmrClient.getStatisticsForDepartment({
        slug: 'b-deild',
      }),
      dmrClient.getStatisticsForDepartment({
        slug: 'c-deild',
      }),
    ].map((promise) =>
      promise.catch((error) => {
        logger.error('Error fetching statistics', {
          error,
          category: LOG_CATEGORY,
        })
        return null
      }),
    ),
  )

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
      statisticsOverview: {
        general,
        personal,
        inactive,
        publishing,
      },
      statisticsByDepartment: {
        a: aStatistics,
        b: bStatistics,
        c: cStatistics,
      },
    }),
  }
}
