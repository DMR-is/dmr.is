import { useEffect, useState } from 'react'

import { GridColumn, GridContainer, GridRow } from '@island.is/island-ui/core'

import { Section } from '../components/section/Section'
import { CaseTableInProgress } from '../components/tables/CaseTableInProgress'
import { CaseTableInReview } from '../components/tables/CaseTableInReview'
import { CaseTableSubmitted } from '../components/tables/CaseTableSubmitted'
import { Tabs } from '../components/tabs/Tabs'
import { FilterGroup } from '../context/filterContext'
import { Case, CaseStatusEnum, Paging } from '../gen/fetch'
import { useFilterContext } from '../hooks/useFilterContext'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { useQueryParams } from '../hooks/useQueryParams'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { CaseProcessingTabIds, Routes } from '../lib/constants'
import { messages } from '../lib/messages/caseProcessingOverview'
import { Screen } from '../lib/types'
import {
  extractCaseProcessingFilters,
  mapQueryParamToCaseProcessingTab,
  mapTabIdToCaseStatus,
} from '../lib/utils'
type Props = {
  data: Case[]
  paging: Paging
  filters?: FilterGroup[]
  totalItems: {
    submitted: number
    inProgress: number
    inReview: number
    ready: number
  }
}

const CaseProcessingScreen: Screen<Props> = ({
  data,
  paging,
  totalItems,
  filters,
}) => {
  const { add, get } = useQueryParams()
  const { setFilterGroups } = useFilterContext()

  const { formatMessage } = useFormatMessage()

  const [selectedTab, setSelectedTab] = useState(
    mapQueryParamToCaseProcessingTab(get('tab')),
  )

  const onTabChange = (id: string) => {
    setSelectedTab(mapQueryParamToCaseProcessingTab(id))
    add({
      tab: mapQueryParamToCaseProcessingTab(id),
    })
  }

  useEffect(() => {
    if (filters) {
      setFilterGroups(filters)
    }
  }, [])

  const tabs = [
    {
      id: CaseProcessingTabIds.Submitted,
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
              status: CaseStatusEnum.Innsent,
            }
          })}
        />
      ),
    },
    {
      id: CaseProcessingTabIds.InProgress,
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
              status: CaseStatusEnum.Grunnvinnsla,
            }
          })}
        />
      ),
    },
    {
      id: CaseProcessingTabIds.InReview,
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
              title: item.advert.title,
              publicationDate: item.publishedAt,
              registrationDate: item.createdAt,
              employee: item.assignedTo,
              tag: item.tag,
              status: CaseStatusEnum.Yfirlestur,
            }
          })}
        />
      ),
    },
    {
      id: CaseProcessingTabIds.Ready,
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
              status: CaseStatusEnum.Tilbi,
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

CaseProcessingScreen.getProps = async ({ query }) => {
  const { filters: extractedFilters, tab } = extractCaseProcessingFilters(query)

  const client = createDmrClient()

  const tabId = mapQueryParamToCaseProcessingTab(tab)
  const selectedStatus = mapTabIdToCaseStatus(tabId)

  const params = {
    ...extractedFilters,
    status: selectedStatus,
  }

  const response = await client.getEditorialOverview(params)

  const filters = [
    {
      label: 'Birting',
      options: [
        { label: 'Mín mál', key: 'employeeId', value: '5804170510' },
        { label: 'Mál í hraðbirtingu', key: 'fastTrack', value: 'true' },
        { label: 'Mál sem bíða svara', key: 'status', value: 'Beðið svara' },
      ],
    },
    {
      label: 'Deildir',
      options: [
        { label: 'A-deild', key: 'department', value: 'A-deild' },
        { label: 'B-deild', key: 'department', value: 'B-deild' },
        { label: 'C-deild', key: 'department', value: 'C-deild' },
      ],
    },
  ]

  return {
    data: response.data,
    paging: response.paging,
    totalItems: response.totalItems,
    filters,
  }
}

export default withMainLayout(CaseProcessingScreen, {
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
        href: Routes.Dashboard,
      },
      {
        title: messages.breadcrumbs.cases,
      },
    ],
  },
})