import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { SkeletonLoader } from '@island.is/island-ui/core'

import { CaseStatusEnum, DepartmentEnum } from '../../gen/fetch'
import { useCasesWithDepartmentCount } from '../../hooks/api'
import { CaseTableOverview } from '../tables/CaseTableOverview'
import { Tabs } from './Tabs'

export const CasePublishedTabs = () => {
  const {
    setParams,
    params: { department, ...params },
  } = useFilters()

  const allowedStatuses = [
    CaseStatusEnum.ÚTgefið,
    CaseStatusEnum.TekiðÚrBirtingu,
    CaseStatusEnum.BirtinguHafnað,
  ]

  const statuses = allowedStatuses.filter((status) =>
    params.status?.includes(status),
  )

  const { caseOverview, isLoading, isValidating, error } =
    useCasesWithDepartmentCount({
      params: {
        department: department[0] as DepartmentEnum,
        ...params,
        status: statuses.length > 0 ? statuses : allowedStatuses,
      },
    })

  const tabs = caseOverview?.departments.map((counter) => ({
    id: counter.department,
    label: `${counter.department} (${counter.count})`,
    content: isLoading ? (
      <SkeletonLoader
        repeat={3}
        height={44}
        space={2}
        borderRadius="standard"
      />
    ) : (
      <CaseTableOverview
        cases={caseOverview.cases}
        isLoading={isValidating}
        paging={caseOverview.paging}
      />
    ),
  }))

  return (
    <Tabs
      onTabChange={(id) => setParams({ department: [id] })}
      tabs={tabs || []}
      selectedTab={department[0] ?? DepartmentEnum.ADeild}
      label="Heildaryfirlit"
    />
  )
}

export default CasePublishedTabs
