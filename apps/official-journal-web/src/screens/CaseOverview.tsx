import { useState } from 'react'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Section } from '../components/section/Section'
import { CaseTableInProgress } from '../components/tables/CaseTableInProgress'
import { CaseTableSubmitted } from '../components/tables/CaseTableSubmitted'
import { Tabs } from '../components/tabs/Tabs'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { CaseOverviewTabIds } from '../lib/constants'
import { messages } from '../lib/messages'
import { Screen } from '../lib/types'
import {
  mapQueryParamToCaseOverviewTab,
  mapTabIdToCaseStatus,
} from '../lib/utils'
import {
  MockCasesType,
  mockInProgressCasesResponse,
  mockSubmittedCasesResponse,
} from './mock'
import { Case, Paging } from '../gen/fetch'
import { CaseTableInReview } from '../components/tables/CaseTableInReview'
import { createDmrClient } from '../lib/api/createClient'

type QueryParams = {
  category?: string
}

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
  const { add, get, refresh } = useQueryParams()

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
      label: `${messages.components.tabs.submitted.title} (${totalItems.submitted})`,
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
      label: `${messages.components.tabs.inProgress.title} (${totalItems.inProgress})`,
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
      label: `${messages.components.tabs.inReview.title} (${totalItems.inReview})`,
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
      label: `${messages.components.tabs.ready.title} (${totalItems.ready})`,
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
  bannerProps: {
    showBanner: true,
    showFilters: true,
    imgSrc: '/assets/banner-small-image.svg',
    title: messages.components.ritstjornBanner.title,
    description: messages.components.ritstjornBanner.description,
    variant: 'small',
    breadcrumbs: [
      {
        title: messages.pages.frontpage.name,
        href: '/',
      },
      {
        title: messages.pages.caseOverview.name,
        href: '/ritstjorn',
      },
    ],
  },
})
