import { parseAsStringEnum, useQueryState } from 'next-usequerystate'

import { SkeletonLoader } from '@island.is/island-ui/core'

import { CaseStatusEnum } from '../../gen/fetch'
import { useCasesWithStatusCount } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useSearchParams } from '../../hooks/useSearchParams'
import { messages } from '../../lib/messages/caseProcessingOverview'
import { CaseTableInProgress } from '../tables/CaseTableInProgress'
import { CaseTableInReview } from '../tables/CaseTableInReview'
import { CaseTableSubmitted } from '../tables/CaseTableSubmitted'
import { Tabs } from './Tabs'

export const CaseOverviewTabs = () => {
  const { formatMessage } = useFormatMessage()

  const [searchParams] = useSearchParams()
  const { status: _status, ...params } = searchParams

  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringEnum<CaseStatusEnum>(
      Object.values(CaseStatusEnum),
    ).withDefault(CaseStatusEnum.Innsent),
  )

  const { cases, statuses, paging, isLoading, isValidating } =
    useCasesWithStatusCount({
      params: {
        status: status,
        statuses: [
          CaseStatusEnum.Innsent,
          CaseStatusEnum.Grunnvinnsla,
          CaseStatusEnum.Yfirlestur,
          CaseStatusEnum.Tilbúið,
        ],
        ...params,
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
      switch (status.status) {
        case CaseStatusEnum.Innsent:
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
        case CaseStatusEnum.Grunnvinnsla:
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
        case CaseStatusEnum.Yfirlestur:
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
        case CaseStatusEnum.Tilbúið:
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
        id: status.status,
        label: label,
        content: TabComponent,
        order: order,
      }
    })
    .sort((a, b) => a.order - b.order)

  return (
    <Tabs
      onTabChange={(id) =>
        setStatus(id as CaseStatusEnum, {
          history: 'replace',
          shallow: true,
        })
      }
      selectedTab={status ?? CaseStatusEnum.Innsent}
      tabs={dynamicTabs || loadingTabs}
      label={formatMessage(messages.tabs.statuses)}
    />
  )
}

export default CaseOverviewTabs
