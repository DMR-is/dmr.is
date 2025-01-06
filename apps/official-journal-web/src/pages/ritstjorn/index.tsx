import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { parseAsInteger, useQueryState } from 'nuqs'
import { useEffect } from 'react'

import { Stack } from '@island.is/island-ui/core'

import { CaseOverviewGrid } from '../../components/case-overview-grid/CaseOverviewGrid'
import { Meta } from '../../components/meta/Meta'
import { CaseTableInProgress } from '../../components/tables/CaseTableInProgress'
import { CaseTableInReview } from '../../components/tables/CaseTableInReview'
import { CaseTableSubmitted } from '../../components/tables/CaseTableSubmitted'
import { Tabs } from '../../components/tabs/Tabs'
import { CaseOverviewStatusTitleEnum } from '../../gen/fetch'
import { useCaseOverview } from '../../hooks/api'
import { useFilterContext } from '../../hooks/useFilterContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { LayoutProps } from '../../layout/Layout'
import { Routes } from '../../lib/constants'
import { messages as caseProccessingMessages } from '../../lib/messages/caseProcessingOverview'
import {
  deleteUndefined,
  loginRedirect,
  mapTabIdToCaseStatus,
} from '../../lib/utils'
import { CustomNextError } from '../../units/error'

export default function CaseProccessingOverviewScreen() {
  const { formatMessage } = useFormatMessage()

  const { setEnableDepartments, setEnableCategories, setEnableTypes } =
    useFilterContext()

  useEffect(() => {
    setEnableDepartments(true)
    setEnableCategories(true)
    setEnableTypes(true)
  }, [])

  const [status, setStatus] = useQueryState('status')
  const [search, setSearch] = useQueryState('search')
  const [department, setDepartment] = useQueryState('department')
  const [type, setType] = useQueryState('type')
  const [category, setCategory] = useQueryState('category')
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [pageSize, setPageSize] = useQueryState(
    'pageSize',
    parseAsInteger.withDefault(10),
  )

  const { cases, statuses, paging, isLoading, isValidating } = useCaseOverview({
    params: {
      status: status ? status : undefined,
      search: search ? search : undefined,
      department: department ? department : undefined,
      type: type ? type : undefined,
      category: category ? category : undefined,
      page: page ? page : undefined,
      pageSize: pageSize ? pageSize : undefined,
    },
  })

  const loading = isLoading || isValidating

  const dynamicTabs = statuses
    ?.map((status) => {
      let TabComponent
      let label
      let order = 0
      switch (status.title) {
        case CaseOverviewStatusTitleEnum.Innsent:
          order = 1
          label = formatMessage(caseProccessingMessages.tabs.submitted, {
            count: status.count,
          })
          TabComponent = (
            <CaseTableSubmitted
              isLoading={loading}
              cases={cases}
              paging={paging}
            />
          )
          break
        case CaseOverviewStatusTitleEnum.Grunnvinnsla:
          order = 2
          label = formatMessage(caseProccessingMessages.tabs.inProgress, {
            count: status.count,
          })
          TabComponent = (
            <CaseTableInProgress
              isLoading={loading}
              cases={cases}
              paging={paging}
            />
          )
          break
        case CaseOverviewStatusTitleEnum.Yfirlestur:
          order = 3
          label = formatMessage(caseProccessingMessages.tabs.inReview, {
            count: status.count,
          })
          TabComponent = (
            <CaseTableInReview
              isLoading={loading}
              cases={cases}
              paging={paging}
            />
          )
          break
        case CaseOverviewStatusTitleEnum.Tilbúið:
          order = 4
          label = formatMessage(caseProccessingMessages.tabs.ready, {
            count: status.count,
          })
          TabComponent = (
            <CaseTableInProgress
              isLoading={loading}
              cases={cases}
              paging={paging}
            />
          )
          break
      }

      return {
        id: status.title,
        label: label,
        content: TabComponent,
        order: order,
      }
    })
    .sort((a, b) => a.order - b.order)

  return (
    <>
      <Meta
        title={`${formatMessage(
          caseProccessingMessages.breadcrumbs.cases,
        )} - ${formatMessage(caseProccessingMessages.breadcrumbs.home)}`}
      />
      <CaseOverviewGrid>
        <Stack space={[2, 2, 3]}>
          <Tabs
            onTabChange={(id) =>
              setStatus(id, {
                history: 'replace',
                shallow: true,
              })
            }
            selectedTab={status ?? 'Innsent'}
            tabs={dynamicTabs ?? []}
            label={formatMessage(caseProccessingMessages.tabs.statuses)}
          />
        </Stack>
      </CaseOverviewGrid>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({
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

  try {
    return {
      props: deleteUndefined({
        session,
        layout,
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
