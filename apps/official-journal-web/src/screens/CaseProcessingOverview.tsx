import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import { AlertMessage, SkeletonLoader } from '@island.is/island-ui/core'

import { CaseOverviewGrid } from '../components/case-overview-grid/CaseOverviewGrid'
import { Meta } from '../components/meta/Meta'
import { CaseTableInProgress } from '../components/tables/CaseTableInProgress'
import { CaseTableInReview } from '../components/tables/CaseTableInReview'
import { CaseTableSubmitted } from '../components/tables/CaseTableSubmitted'
import { Tab, Tabs } from '../components/tabs/Tabs'
import { Case, CaseStatusTitleEnum, Paging } from '../gen/fetch'
import { useCaseOverview } from '../hooks/api'
import { useFilterContext } from '../hooks/useFilterContext'
import { useFormatMessage } from '../hooks/useFormatMessage'
import { withMainLayout } from '../layout/Layout'
import { createDmrClient } from '../lib/api/createClient'
import { Routes } from '../lib/constants'
import { messages as caseProccessingMessages } from '../lib/messages/caseProcessingOverview'
import { messages as errorMessages } from '../lib/messages/errors'
import {
  CaseOverviewSearchParams,
  getStringFromQueryString,
  Screen,
} from '../lib/types'
import { CustomNextError } from '../units/error'
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

  const [selectedTab, setSelectedTab] = useState<CaseStatusTitleEnum>(
    (router.query.status as CaseStatusTitleEnum) ?? CaseStatusTitleEnum.Innsent,
  )

  const [searchParams, setSearchParams] = useState<CaseOverviewSearchParams>({
    search: getStringFromQueryString(router.query.search),
    department: getStringFromQueryString(router.query.department),
    status: getStringFromQueryString(router.query.status),
    page: Number(getStringFromQueryString(router.query.page)) || undefined,
    type: getStringFromQueryString(router.query.type),
    category: getStringFromQueryString(router.query.category),
    pageSize:
      Number(getStringFromQueryString(router.query.pageSize)) || undefined,
  })

  useEffect(() => {
    setSearchParams({
      search: getStringFromQueryString(router.query.search),
      department: getStringFromQueryString(router.query.department),
      status: getStringFromQueryString(router.query.status),
      page: Number(getStringFromQueryString(router.query.page)) || undefined,
      type: getStringFromQueryString(router.query.type),
      category: getStringFromQueryString(router.query.category),
      pageSize:
        Number(getStringFromQueryString(router.query.pageSize)) || undefined,
    })
  }, [router.query])

  const qsp = useMemo(() => {
    return searchParams
  }, [searchParams])

  const {
    data: casesResponse,
    error,
    isLoading,
  } = useCaseOverview({
    params: qsp,
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
    const tabId = id as CaseStatusTitleEnum
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

  if (isLoading) {
    return (
      <CaseOverviewGrid>
        <SkeletonLoader repeat={3} height={44} />
      </CaseOverviewGrid>
    )
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

  const tabs: Tab<CaseStatusTitleEnum>[] = [
    {
      id: CaseStatusTitleEnum.Innsent,
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
      id: CaseStatusTitleEnum.Grunnvinnsla,
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
      id: CaseStatusTitleEnum.Yfirlestur,
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
      id: CaseStatusTitleEnum.Tilbi,
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
    <>
      <Meta
        title={`${formatMessage(
          caseProccessingMessages.breadcrumbs.cases,
        )} - ${formatMessage(caseProccessingMessages.breadcrumbs.home)}`}
      />
      <CaseOverviewGrid>
        <Tabs
          onTabChange={onTabChange}
          selectedTab={selectedTab}
          tabs={tabs}
          label={formatMessage(caseProccessingMessages.tabs.statuses)}
        />
      </CaseOverviewGrid>
    </>
  )
}

CaseProccessingOverviewScreen.getProps = async ({ query }) => {
  try {
    const dmrClient = createDmrClient()
    const caseData = await dmrClient.editorialOverview({
      page: getStringFromQueryString(query.page),
      pageSize: getStringFromQueryString(query.pageSize),
      department: getStringFromQueryString(query.department),
      status: getStringFromQueryString(query.status),
      search: getStringFromQueryString(query.search),
    })

    return {
      data: caseData.cases,
      paging: caseData.paging,
      totalItems: caseData.totalItems,
    }
  } catch (error) {
    throw new CustomNextError(
      500,
      'Villa kom upp við að sækja gögn fyrir ritstjórn.',
      (error as Error)?.message,
    )
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
