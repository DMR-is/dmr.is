import { useState } from 'react'
import { useIntl } from 'react-intl'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Section } from '../components/section/Section'
import { CaseTableInProgress } from '../components/tables/CaseTableInProgress'
import { CaseTableInReview } from '../components/tables/CaseTableInReview'
import { CaseTableSubmitted } from '../components/tables/CaseTableSubmitted'
import { Tabs } from '../components/tabs/Tabs'
import { Case, Paging } from '../gen/fetch'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { CaseOverviewTabIds } from '../lib/constants'
import { messages } from '../lib/messages/caseOverview'
import { Screen } from '../lib/types'
import {
  mapQueryParamToCaseOverviewTab,
  mapTabIdToCaseStatus,
} from '../lib/utils'
type Props = {
  data: Case[]
  paging: Paging
  totalItems: {
    submitted: number
    inProgress: number
    inReview: number
    ready: number
  }
}

const CaseOverviewPage: Screen<Props> = ({ data, paging, totalItems }) => {
  const { add, get } = useQueryParams()

  const { formatMessage } = useIntl()

  const [selectedTab, setSelectedTab] = useState(
    mapQueryParamToCaseOverviewTab(get('tab')),
  )

  const onTabChange = (id: string) => {
    setSelectedTab(mapQueryParamToCaseOverviewTab(id))
    add({
      tab: mapQueryParamToCaseOverviewTab(id),
    })
  }

  const tabs = [
    {
      id: CaseOverviewTabIds.Submitted,
      label: formatMessage(messages.tabs.submitted, {
        count: totalItems.submitted,
      }),
      content: (
        <CaseTableSubmitted
          data={data.map((item) => {
            return {
              id: item.id,
              department: item.advert.department.title,
              labels: item.fastTrack ? ['fasttrack'] : [],
              title: item.advert.title,
              publicationDate: item.publishedAt,
              registrationDate: item.createdAt,
            }
          })}
        />
      ),
    },
    {
      id: CaseOverviewTabIds.InProgress,
      label: formatMessage(messages.tabs.inProgress, {
        count: totalItems.inProgress,
      }),
      content: (
        <CaseTableInProgress
          data={data.map((item) => {
            return {
              id: item.id,
              department: item.advert.department.title,
              labels: item.fastTrack ? ['fasttrack'] : [],
              title: item.advert.title,
              publicationDate: item.publishedAt,
              registrationDate: item.createdAt,
              employee: item.assignedTo,
            }
          })}
        />
      ),
    },
    {
      id: CaseOverviewTabIds.InReview,
      label: formatMessage(messages.tabs.inReview, {
        count: totalItems.inReview,
      }),
      content: (
        <CaseTableInReview
          data={data.map((item) => {
            return {
              id: item.id,
              department: item.advert.department.title,
              labels: item.fastTrack ? ['fasttrack'] : [],
              name: item.advert.title,
              publicationDate: item.publishedAt,
              registrationDate: item.createdAt,
              employee: item.assignedTo,
              tag: item.tag,
            }
          })}
        />
      ),
    },
    {
      id: CaseOverviewTabIds.Ready,
      label: formatMessage(messages.tabs.ready, {
        count: totalItems.ready,
      }),
      content: (
        <CaseTableInProgress
          data={data.map((item) => {
            return {
              id: item.id,
              department: item.advert.department.title,
              labels: item.fastTrack ? ['fasttrack'] : [],
              title: item.advert.title,
              publicationDate: item.publishedAt,
              registrationDate: item.createdAt,
              employee: item.assignedTo,
            }
          })}
        />
      ),
    },
  ]

  return (
    <Section paddingTop="off">
      <GridContainer>
        <GridRow rowGap={['p2', 3]}>
          <GridColumn
            paddingTop={2}
            offset={['0', '0', '0', '1/12']}
            span={['12/12', '12/12', '12/12', '10/12']}
          >
            <Tabs
              onlyRenderSelectedTab={true}
              onTabChange={onTabChange}
              selectedTab={selectedTab}
              tabs={tabs}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}

CaseOverviewPage.getProps = async ({ query }) => {
  const { tab, search } = query

  const client = createDmrClient()

  const tabId = mapQueryParamToCaseOverviewTab(tab)
  const selectedStatus = mapTabIdToCaseStatus(tabId)

  const response = await client.getEditorialOverview({
    status: selectedStatus,
    search: search as string,
  })

  return {
    data: response.data,
    paging: response.paging,
    totalItems: response.totalItems,
  }
}

export default withMainLayout(CaseOverviewPage, {
  filterGroups: [
    {
      label: 'Birting',
      options: [
        { label: 'Mín mál', value: 'my-cases' },
        { label: 'Mál í hraðbirtingu', value: 'fasttrack' },
        { label: 'Mál sem bíða svara', value: 'waiting' },
      ],
    },
  ],
  bannerProps: {
    showBanner: true,
    showFilters: true,
    imgSrc: '/assets/banner-small-image.svg',
    title: messages.banner.title,
    description: messages.banner.description,
    variant: 'small',
    breadcrumbs: [
      {
        title: messages.breadcrumbs.home,
        href: '/',
      },
      {
        title: messages.breadcrumbs.cases,
        href: '/ritstjorn',
      },
    ],
  },
})
