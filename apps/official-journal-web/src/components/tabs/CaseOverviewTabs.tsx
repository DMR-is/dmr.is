import { parseAsInteger, useQueryState } from 'next-usequerystate'

import { SkeletonLoader } from '@island.is/island-ui/core'

import { CaseOverviewStatusTitleEnum } from '../../gen/fetch'
import { useCaseOverview } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../../lib/messages/caseProcessingOverview'
import { CaseTableInProgress } from '../tables/CaseTableInProgress'
import { CaseTableInReview } from '../tables/CaseTableInReview'
import { CaseTableSubmitted } from '../tables/CaseTableSubmitted'
import { Tabs } from './Tabs'

export const CaseOverviewTabs = () => {
  const { formatMessage } = useFormatMessage()

  const [status, setStatus] = useQueryState('status')
  const [search] = useQueryState('search')
  const [department] = useQueryState('department')
  const [type] = useQueryState('type')
  const [category] = useQueryState('category')
  const [page] = useQueryState('page', parseAsInteger.withDefault(1))
  const [pageSize] = useQueryState('pageSize', parseAsInteger.withDefault(10))

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

  const loading = isLoading

  const loadingTabs = [
    {
      id: 'Innsent',
      label: formatMessage(messages.tabs.submittedNoCount),
      content: (
        <SkeletonLoader
          repeat={3}
          height={44}
          borderRadius="standard"
          space={2}
        />
      ),
    },
    {
      id: 'Grunnvinnsla',
      label: formatMessage(messages.tabs.inProgressNoCount),
      content: (
        <SkeletonLoader
          repeat={3}
          height={44}
          borderRadius="standard"
          space={2}
        />
      ),
    },
    {
      id: 'Yfirlestur',
      label: formatMessage(messages.tabs.inReviewNoCount),
      content: (
        <SkeletonLoader
          repeat={3}
          height={44}
          borderRadius="standard"
          space={2}
        />
      ),
    },
    {
      id: 'Tilbúið',
      label: formatMessage(messages.tabs.readyNoCount),
      content: (
        <SkeletonLoader
          repeat={3}
          height={44}
          borderRadius="standard"
          space={2}
        />
      ),
    },
  ]

  const dynamicTabs = statuses
    ?.map((status) => {
      let TabComponent
      let label
      let order = 0
      switch (status.title) {
        case CaseOverviewStatusTitleEnum.Innsent:
          order = 1
          label = formatMessage(messages.tabs.submitted, {
            count: status.count,
          })
          TabComponent = loading ? (
            <SkeletonLoader
              repeat={3}
              height={44}
              borderRadius="standard"
              space={2}
            />
          ) : (
            <CaseTableSubmitted
              isLoading={isValidating}
              cases={cases}
              paging={paging}
            />
          )
          break
        case CaseOverviewStatusTitleEnum.Grunnvinnsla:
          order = 2
          label = formatMessage(messages.tabs.inProgress, {
            count: status.count,
          })
          TabComponent = loading ? (
            <SkeletonLoader
              repeat={3}
              height={44}
              borderRadius="standard"
              space={2}
            />
          ) : (
            <CaseTableInProgress
              isLoading={isValidating}
              cases={cases}
              paging={paging}
            />
          )
          break
        case CaseOverviewStatusTitleEnum.Yfirlestur:
          order = 3
          label = formatMessage(messages.tabs.inReview, {
            count: status.count,
          })
          TabComponent = loading ? (
            <SkeletonLoader
              repeat={3}
              height={44}
              borderRadius="standard"
              space={2}
            />
          ) : (
            <CaseTableInReview
              isLoading={isValidating}
              cases={cases}
              paging={paging}
            />
          )
          break
        case CaseOverviewStatusTitleEnum.Tilbúið:
          order = 4
          label = formatMessage(messages.tabs.ready, {
            count: status.count,
          })
          TabComponent = loading ? (
            <SkeletonLoader
              repeat={3}
              height={44}
              borderRadius="standard"
              space={2}
            />
          ) : (
            <CaseTableInProgress
              isLoading={isValidating}
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
    <Tabs
      onTabChange={(id) =>
        setStatus(id, {
          history: 'replace',
          shallow: true,
        })
      }
      selectedTab={status ?? CaseOverviewStatusTitleEnum.Innsent}
      tabs={dynamicTabs || loadingTabs}
      label={formatMessage(messages.tabs.statuses)}
    />
  )
}

export default CaseOverviewTabs