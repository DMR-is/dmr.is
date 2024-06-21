import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import { AlertMessage } from '@island.is/island-ui/core'

import { CaseOverviewGrid } from '../components/case-overview-grid/CaseOverviewGrid'
import { CaseTableInProgress } from '../components/tables/CaseTableInProgress'
import { CaseTableInReview } from '../components/tables/CaseTableInReview'
import { CaseTableSubmitted } from '../components/tables/CaseTableSubmitted'
import { Tab, Tabs } from '../components/tabs/Tabs'
import { Case, Paging } from '../gen/fetch'
import { useCaseOverview } from '../hooks/api'
import { useFilterContext } from '../hooks/useFilterContext'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { Routes } from '../lib/constants'
import { messages as caseProccessingMessages } from '../lib/messages/caseProcessingOverview'
import { messages as errorMessages } from '../lib/messages/errors'
import { CaseOverviewSearchParams, Screen } from '../lib/types'
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

  const { setEnableDepartments, setEnableCategories, setEnableTypes } =
    useFilterContext()

  useEffect(() => {
    setEnableDepartments(true)
    setEnableCategories(true)
    setEnableTypes(true)
  }, [])

  const [selectedTab, setSelectedTab] = useState<CaseStatus>('Innsent')

  const [searchParams, setSearchParams] = useState<CaseOverviewSearchParams>({
    search: router.query.search,
    department: router.query.department,
    status: router.query.status,
    page: router.query.page,
    type: router.query.type,
    category: router.query.category,
    pageSize: router.query.pageSize,
  })

  useEffect(() => {
    setSearchParams({
      search: router.query.search,
      department: router.query.department,
      status: router.query.status,
      page: router.query.page,
      type: router.query.type,
      category: router.query.category,
      pageSize: router.query.pageSize,
    })
  }, [router.query])

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

  const { data: casesResponse, error } = useCaseOverview({
    qsp: qsp,
    options: {
      keepPreviousData: true,
      fallback: {
        cases: data,
        paging: paging,
        totalItems,
      },
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
        count: casesResponse.totalItems.submitted,
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
        count: casesResponse.totalItems.inProgress,
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
        count: casesResponse.totalItems.inReview,
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
        count: casesResponse.totalItems.ready,
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

  const { page, pageSize, department, status, search } = query

  const caseData = await dmrClient.getEditorialOverview({
    page: Array.isArray(page) ? page[0] : page,
    pageSize: Array.isArray(pageSize) ? pageSize[0] : pageSize,
    department: Array.isArray(department) ? department[0] : department,
    status: Array.isArray(status) ? status[0] : status,
    search: Array.isArray(search) ? search[0] : search,
  })

  return {
    data: caseData.cases,
    paging: caseData.paging,
    totalItems: caseData.totalItems,
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
