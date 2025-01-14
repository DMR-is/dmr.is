import { parseAsStringEnum, useQueryState } from 'next-usequerystate'

import { CaseStatusEnum, DepartmentEnum } from '../../gen/fetch'
import { useCasesWithDepartmentCount } from '../../hooks/api'
import { useSearchParams } from '../../hooks/useSearchParams'
import CaseTableReady from '../tables/CaseTableReady'
import { Tabs } from './Tabs'

export const ReadyForPublicationTabs = () => {
  const [searchParams] = useSearchParams()
  const { department: _department, status: _status, ...rest } = searchParams

  const [department, setDepartment] = useQueryState(
    'department',
    parseAsStringEnum<DepartmentEnum>(
      Object.values(DepartmentEnum),
    ).withDefault(DepartmentEnum.ADeild),
  )

  const { caseOverview, isLoading } = useCasesWithDepartmentCount({
    params: {
      department: department,
      status: [CaseStatusEnum.Tilbúið],
      ...rest,
    },
  })

  const tabs = caseOverview?.departments.map((counter) => ({
    id: counter.department,
    label: `${counter.department} (${counter.count})`,
    content: (
      <CaseTableReady isLoading={isLoading} cases={caseOverview.cases} />
    ),
  }))

  return (
    <Tabs
      tabs={tabs ?? []}
      selectedTab={department}
      onTabChange={(id) => setDepartment(id as DepartmentEnum)}
      label={'Deildir'}
    />
  )
}

export default ReadyForPublicationTabs
