import {
  parseAsInteger,
  parseAsStringEnum,
  useQueryState,
} from 'next-usequerystate'

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

  const [page] = useQueryState('page', parseAsInteger)
  const [pageSize] = useQueryState('pageSize', parseAsInteger)
  const [search] = useQueryState('search')

  const statuses = [
    CaseStatusEnum.ÚTgefið,
    CaseStatusEnum.TekiðÚrBirtingu,
    CaseStatusEnum.BirtinguHafnað,
  ]

  const { caseOverview, isLoading, isValidating, error } =
    useCasesWithDepartmentCount({
      params: {
        department: department,
        status: statuses.join(','),
        page,
        pageSize,
        search,
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
      <CaseTableOverview cases={caseOverview.cases} isLoading={isValidating} />
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
