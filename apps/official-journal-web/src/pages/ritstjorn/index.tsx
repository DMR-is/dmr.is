import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useRouter } from 'next/router'
import { getSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'

import {
  AlertMessage,
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
} from '@island.is/island-ui/core'

import { CaseOverviewGrid } from '../../components/case-overview-grid/CaseOverviewGrid'
import { Meta } from '../../components/meta/Meta'
import { CaseTableInProgress } from '../../components/tables/CaseTableInProgress'
import { CaseTableInReview } from '../../components/tables/CaseTableInReview'
import { CaseTableSubmitted } from '../../components/tables/CaseTableSubmitted'
import { Tab, Tabs } from '../../components/tabs/Tabs'
import {
  Case,
  CaseStatusTitleEnum,
  EditorialOverviewRequest,
  Paging,
} from '../../gen/fetch'
import { CaseEditorialOverviewParams, useCaseOverview } from '../../hooks/api'
import { useFilterContext } from '../../hooks/useFilterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { messages as caseProccessingMessages } from '../../lib/messages/caseProcessingOverview'
import { messages as errorMessages } from '../../lib/messages/errors'
import { getStringFromQueryString } from '../../lib/types'
import { deleteUndefined, loginRedirect } from '../../lib/utils'
import { CustomNextError } from '../../units/error'

type Props = {
  cases: Case[]
  paging: Paging
  totalItems: {
    submitted: number
    inProgress: number
    inReview: number
    ready: number
  }
}

export default function CaseProccessingOverviewScreen(
  data: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { cases, paging, totalItems } = data
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

  const [searchParams, setSearchParams] = useState<CaseEditorialOverviewParams>(
    {
      search: getStringFromQueryString(router.query.search),
      department: getStringFromQueryString(router.query.department),
      status: getStringFromQueryString(router.query.status),
      page: Number(getStringFromQueryString(router.query.page)) || undefined,
      type: getStringFromQueryString(router.query.type),
      category: getStringFromQueryString(router.query.category),
      pageSize:
        Number(getStringFromQueryString(router.query.pageSize)) || undefined,
    },
  )

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
      refreshInterval: 1000 * 60 * 1,
      revalidateOnFocus: true,
      fallback: {
        cases,
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
      router.replace(
        {
          query: { ...router.query, status: tabId },
        },
        undefined,
        { shallow: true },
      )
    }
  }

  const currentCases = casesResponse?.cases ? casesResponse.cases : cases
  const currentPaging = casesResponse?.paging ? casesResponse.paging : paging

  const submittedCount = casesResponse?.totalItems.submitted ?? 0
  const inProgressCount = casesResponse?.totalItems.inProgress ?? 0
  const inReviewCount = casesResponse?.totalItems.inReview ?? 0
  const readyCount = casesResponse?.totalItems.ready ?? 0

  const tabs: Tab<CaseStatusTitleEnum>[] = [
    {
      id: CaseStatusTitleEnum.Innsent,
      label: formatMessage(caseProccessingMessages.tabs.submitted, {
        count: submittedCount,
      }),
      content: (
        <CaseTableSubmitted
          isLoading={isLoading}
          data={currentCases}
          paging={currentPaging}
        />
      ),
    },
    {
      id: CaseStatusTitleEnum.Grunnvinnsla,
      label: formatMessage(caseProccessingMessages.tabs.inProgress, {
        count: inProgressCount,
      }),
      content: (
        <CaseTableInProgress
          isLoading={isLoading}
          data={currentCases}
          paging={currentPaging}
        />
      ),
    },
    {
      id: CaseStatusTitleEnum.Yfirlestur,
      label: formatMessage(caseProccessingMessages.tabs.inReview, {
        count: inReviewCount,
      }),
      content: (
        <CaseTableInReview
          isLoading={isLoading}
          data={currentCases}
          paging={currentPaging}
        />
      ),
    },
    {
      id: CaseStatusTitleEnum.Tilbúið,
      label: formatMessage(caseProccessingMessages.tabs.ready, {
        count: readyCount,
      }),
      content: (
        <CaseTableInProgress
          isLoading={isLoading}
          data={currentCases}
          paging={currentPaging}
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
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            {error && (
              <AlertMessage
                type="error"
                title="Villa kom upp"
                message="Ekki tókst að sækja mál"
              />
            )}
          </GridColumn>
        </GridRow>
      </GridContainer>
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

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  query,
  resolvedUrl,
}) => {
  const session = await getSession({ req })

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const layout: LayoutProps = {
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
  }

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
      props: deleteUndefined({
        session,
        layout,
        cases: caseData.cases,
        paging: caseData.paging,
        totalItems: caseData.totalItems,
      }),
    }
  } catch (error) {
    throw new CustomNextError(
      500,
      'Villa kom upp við að sækja gögn fyrir ritstjórn.',
      (error as Error)?.message,
    )
  }
}
