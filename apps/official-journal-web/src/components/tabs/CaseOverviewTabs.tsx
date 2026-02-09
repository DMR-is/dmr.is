import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { CaseStatusEnum } from '../../gen/fetch'
import { useCasesWithStatusCount } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../../lib/messages/caseProcessingOverview'
import { CaseTableInProgress } from '../tables/CaseTableInProgress'
import { CaseTableInReview } from '../tables/CaseTableInReview'
import { CaseTableSubmitted } from '../tables/CaseTableSubmitted'
import { Tabs } from './Tabs'

export const CaseOverviewTabs = () => {
  const { formatMessage } = useFormatMessage()
  const { params, setParams } = useFilters({
    initialPageSize: 50,
  })

  const { cases, statuses, paging } = useCasesWithStatusCount({
    params: {
      statuses: [
        CaseStatusEnum.Innsent,
        CaseStatusEnum.Grunnvinnsla,
        CaseStatusEnum.Yfirlestur,
        CaseStatusEnum.Tilbúið,
      ],
      ...params,
      status: params.status[0] as CaseStatusEnum,
    },
  })

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
          TabComponent = <CaseTableSubmitted cases={cases} paging={paging} />
          break
        case CaseStatusEnum.Grunnvinnsla:
          order = 2
          label = formatMessage(messages.tabs.inProgress, {
            count: status.count,
          })
          TabComponent = <CaseTableInProgress cases={cases} paging={paging} />
          break
        case CaseStatusEnum.Yfirlestur:
          order = 3
          label = formatMessage(messages.tabs.inReview, {
            count: status.count,
          })
          TabComponent = <CaseTableInReview cases={cases} paging={paging} />
          break
        case CaseStatusEnum.Tilbúið:
          order = 4
          label = formatMessage(messages.tabs.ready, {
            count: status.count,
          })
          TabComponent = <CaseTableInProgress cases={cases} paging={paging} />
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
      onTabChange={(id) => setParams({ status: [id as CaseStatusEnum] })}
      selectedTab={params.status[0] ?? CaseStatusEnum.Innsent}
      tabs={dynamicTabs || loadingTabs}
      label={formatMessage(messages.tabs.statuses)}
    />
  )
}

export default CaseOverviewTabs
