import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { AlertMessage, SkeletonLoader } from '@island.is/island-ui/core'

import { CaseOverviewGrid } from '../components/case-overview-grid/CaseOverviewGrid'
import { CaseTableInProgress } from '../components/tables/CaseTableInProgress'
import { CaseTableInReview } from '../components/tables/CaseTableInReview'
import { CaseTableSubmitted } from '../components/tables/CaseTableSubmitted'
import { Tab, Tabs } from '../components/tabs/Tabs'
import { Case, Paging } from '../gen/fetch'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { APIRotues, getCases, Routes } from '../lib/constants'
import { messages as caseProccessingMessages } from '../lib/messages/caseProcessingOverview'
import { messages as errorMessages } from '../lib/messages/errors'
import { CaseOverviewSearchParams, Screen } from '../lib/types'
import { mapTabIdToCaseStatus } from '../lib/utils'
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

type CaseStatus = 'Innsent' | 'Grunnvinnsla' | 'Yfirlestur' | 'Tilbúið'

const CaseProccessingOverviewTabIds: CaseStatus[] = [
  'Innsent',
  'Grunnvinnsla',
  'Yfirlestur',
  'Tilbúið',
]

const CaseProccessingOverviewScreen: Screen<Props> = ({
  data,
  paging,
  totalItems,
}) => {
  const { formatMessage } = useFormatMessage()
  const router = useRouter()

  const [selectedTab, setSelectedTab] = useState<CaseStatus>('Innsent')

  const [searchParams, setSearchParams] = useState<CaseOverviewSearchParams>({
    search: undefined,
    department: router.query.department,
    status: router.query.status,
    page: undefined,
    pageSize: undefined,
  })

  const qsp = useMemo(() => {
    const filters = Object.entries(searchParams).filter(
      ([key, value]) => value !== undefined,
    )

    const qs = new URLSearchParams()

    filters.forEach(([key, value]) => {
      qs.append(key, value as string)
    })

    return qs.toString()
  }, [searchParams])

  const {
    data: casesResponse,
    isLoading,
    error,
  } = useSWR([APIRotues.Cases, qsp], ([url, qsp]) => getCases(url, qsp), {
    keepPreviousData: true,
    fallback: {
      cases: data,
      paging: paging,
    },
  })

  const onTabChange = (id: string) => {
    const tabId = CaseProccessingOverviewTabIds.find((tab) => tab === id)
    if (tabId) {
      setSelectedTab(tabId)
      setSearchParams({
        ...searchParams,
        status: tabId,
      })
      router.push(
        {
          query: { ...router.query, status: tabId },
        },
        undefined,
        { shallow: true },
      )
    }
  }

  if (error) {
    return (
      <CaseOverviewGrid>
        <AlertMessage
          type="error"
          message={formatMessage(errorMessages.errorFetchingData)}
          title={formatMessage(errorMessages.internalServerError)}
        />
      </CaseOverviewGrid>
    )
  }

  if (isLoading) {
    return (
      <CaseOverviewGrid>
        <SkeletonLoader repeat={5} height={44} space={1} />
      </CaseOverviewGrid>
    )
  }

  if (!casesResponse) {
    return (
      <CaseOverviewGrid>
        <AlertMessage
          type="warning"
          message={formatMessage(errorMessages.noDataText)}
          title={formatMessage(errorMessages.noDataTitle)}
        />
      </CaseOverviewGrid>
    )
  }

  const tabs: Tab<CaseStatus>[] = [
    {
      id: 'Innsent',
      label: formatMessage(caseProccessingMessages.tabs.submitted, {
        count: totalItems.submitted,
      }),
      content: (
        <CaseTableSubmitted
          paging={casesResponse.paging}
          data={casesResponse.cases}
        />
      ),
    },
    {
      id: 'Grunnvinnsla',
      label: formatMessage(caseProccessingMessages.tabs.inProgress, {
        count: totalItems.inProgress,
      }),
      content: (
        <CaseTableInProgress
          paging={casesResponse.paging}
          data={casesResponse.cases}
        />
      ),
    },
    {
      id: 'Yfirlestur',
      label: formatMessage(caseProccessingMessages.tabs.inReview, {
        count: totalItems.inReview,
      }),
      content: (
        <CaseTableInReview
          paging={casesResponse.paging}
          data={casesResponse.cases}
        />
      ),
    },
    {
      id: 'Tilbúið',
      label: formatMessage(caseProccessingMessages.tabs.ready, {
        count: totalItems.ready,
      }),
      content: (
        <CaseTableInProgress
          paging={casesResponse.paging}
          data={casesResponse.cases}
        />
      ),
    },
  ]

  return (
    <CaseOverviewGrid>
      <Tabs
        onTabChange={onTabChange}
        selectedTab={selectedTab}
        tabs={tabs}
        label={formatMessage(caseProccessingMessages.tabs.statuses)}
      />
    </CaseOverviewGrid>
  )
}

CaseProccessingOverviewScreen.getProps = async ({ query }) => {
  const dmrClient = createDmrClient()

  const selectedStatus = mapTabIdToCaseStatus('Innsent')

  const response = await dmrClient.getEditorialOverview({
    status: selectedStatus,
    pageSize: '10',
  })

  return {
    data: response.data,
    paging: response.paging,
    totalItems: response.totalItems,
    filters: [],
  }
}

export default withMainLayout(CaseProccessingOverviewScreen, {
  bannerProps: {
    showBanner: true,
    showFilters: true,
    imgSrc: '/assets/banner-small-image.svg',
    title: caseProccessingMessages.banner.title,
    description: caseProccessingMessages.banner.description,
    variant: 'small',
    breadcrumbs: [
      {
        title: caseProccessingMessages.breadcrumbs.home,
        href: Routes.Dashboard,
      },
      {
        title: caseProccessingMessages.breadcrumbs.cases,
      },
    ],
  },
})
