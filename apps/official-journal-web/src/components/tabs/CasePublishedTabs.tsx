import { parseAsStringEnum, useQueryState } from 'next-usequerystate'
import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { SkeletonLoader } from '@island.is/island-ui/core'

import { CaseStatusEnum, DepartmentEnum } from '../../gen/fetch'
import { useCasesWithDepartmentCount } from '../../hooks/api'
import { CaseTableOverview } from '../tables/CaseTableOverview'
import { Tabs } from './Tabs'

export const CasePublishedTabs = () => {
  const [department, setDepartment] = useQueryState(
    'department',
    parseAsStringEnum(Object.values(DepartmentEnum)).withDefault(
      DepartmentEnum.ADeild,
    ),
  )
  const { params } = useFilters()

  const statuses = [
    CaseStatusEnum.ÚTgefið,
    CaseStatusEnum.TekiðÚrBirtingu,
    CaseStatusEnum.BirtinguHafnað,
  ]

  const { caseOverview, isLoading, isValidating, error } =
    useCasesWithDepartmentCount({
      params: {
        department: department,
        ...params,
        status: statuses,
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
      onTabChange={(id) => setDepartment(id as DepartmentEnum)}
      tabs={tabs || []}
      selectedTab={department ?? DepartmentEnum.ADeild}
      label="Heildaryfirlit"
    />
  )
}

export default CasePublishedTabs
