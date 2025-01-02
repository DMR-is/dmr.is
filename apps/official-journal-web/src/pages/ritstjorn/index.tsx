import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { getSession } from 'next-auth/react'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'

import {
  AlertMessage,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { CaseOverviewGrid } from '../../components/case-overview-grid/CaseOverviewGrid'
import { Meta } from '../../components/meta/Meta'
import { CaseTableInProgress } from '../../components/tables/CaseTableInProgress'
import { CaseTableInReview } from '../../components/tables/CaseTableInReview'
import { CaseTableSubmitted } from '../../components/tables/CaseTableSubmitted'
import { Tab, Tabs } from '../../components/tabs/Tabs'
import {
  CaseOverview,
  CaseOverviewStatus,
  CaseStatusTitleEnum,
  EditorialOverviewRequest,
  Paging,
} from '../../gen/fetch'
import { useCaseOverview } from '../../hooks/api'
import { useFilterContext } from '../../hooks/useFilterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { messages as caseProccessingMessages } from '../../lib/messages/caseProcessingOverview'
import { getStringFromQueryString } from '../../lib/types'
import {
  deleteUndefined,
  loginRedirect,
  mapTabIdToCaseStatus,
} from '../../lib/utils'
import { CustomNextError } from '../../units/error'

type CaseOverviewSearchParams = EditorialOverviewRequest

type Props = {
  cases: CaseOverview[]
  statuses: CaseOverviewStatus[]
  paging: Paging
}

export default function CaseProccessingOverviewScreen(
  data: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  const { cases, paging, statuses } = data
  const { formatMessage } = useFormatMessage()

  const { setEnableDepartments, setEnableCategories, setEnableTypes } =
    useFilterContext()

  useEffect(() => {
    setEnableDepartments(true)
    setEnableCategories(true)
    setEnableTypes(true)
  }, [])

  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault('Innsent'),
  )
  const [search, setSearch] = useQueryState('search')
  const [department, setDepartment] = useQueryState('department')
  const [type, setType] = useQueryState('type')
  const [category, setCategory] = useQueryState('category')
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [pageSize, setPageSize] = useQueryState(
    'pageSize',
    parseAsInteger.withDefault(10),
  )

  const {
    data: casesResponse,
    error,
    isLoading,
  } = useCaseOverview({
    options: {
      keepPreviousData: true,
      refreshInterval: 1000 * 60 * 1,
      revalidateOnFocus: true,
      fallback: {
        cases,
        paging,
        statuses,
      },
    },
  })

  // const onTabChange = (id: string) => {
  //   const tabId = id as CaseStatusTitleEnum
  //   if (tabId) {
  //     setSelectedTab(tabId)
  //     setSearchParams({
  //       ...searchParams,
  //       status: tabId,
  //     })
  //     router.replace(
  //       {
  //         query: { ...router.query, status: tabId },
  //       },
  //       undefined,
  //       { shallow: true },
  //     )
  //   }
  // }

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
          onTabChange={(id) => setStatus(id)}
          selectedTab={status}
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

  const currentStatus = query?.status
  const status = mapTabIdToCaseStatus(currentStatus as string)

  if (!currentStatus) {
    return {
      redirect: {
        destination: `${Routes.ProcessingOverview}?status=${status}`,
        permanent: false,
      },
    }
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

  const qsp = {
    search: getStringFromQueryString(query.search),
    department: getStringFromQueryString(query.department),
    status: getStringFromQueryString(query.status),
    type: getStringFromQueryString(query.type),
    category: getStringFromQueryString(query.category),
    page: getStringFromQueryString(query.page) || undefined,
    pageSize: getStringFromQueryString(query.pageSize) || undefined,
  }

  try {
    const dmrClient = createDmrClient()
    const { cases, paging, statuses } = await dmrClient.editorialOverview({
      ...qsp,
      status: status,
    })

    return {
      props: deleteUndefined({
        session,
        layout,
        cases: cases,
        paging: paging,
        statuses,
        qsp,
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
