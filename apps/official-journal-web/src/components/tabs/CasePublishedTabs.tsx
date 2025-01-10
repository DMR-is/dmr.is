import {
  parseAsInteger,
  parseAsStringEnum,
  useQueryState,
} from 'next-usequerystate'
import slugify from 'slugify'

import { SkeletonLoader } from '@island.is/island-ui/core'

import { GetFinishedCasesDepartmentSlugEnum as DepartmentSlugEnum } from '../../gen/fetch'
import { usePublishedCases } from '../../hooks/api'
import { CaseTableOverview } from '../tables/CaseTableOverview'
import { Tabs } from './Tabs'

export const CasePublishedTabs = () => {
  const [department, setDepartment] = useQueryState(
    'department',
    parseAsStringEnum(Object.values(DepartmentSlugEnum)).withDefault(
      DepartmentSlugEnum.ADeild,
    ),
  )

  const [page] = useQueryState('page', parseAsInteger)
  const [pageSize] = useQueryState('pageSize', parseAsInteger)
  const [search] = useQueryState('search')

  const { caseOverview, isLoading, isValidating, error } = usePublishedCases({
    params: {
      departmentSlug: department,
      page,
      pageSize,
      search,
    },
  })

  const tabs = caseOverview?.counter.map((counter) => ({
    id: slugify(counter.department, { lower: true }),
    label: `${counter.department} (${counter.count})`,
    content: isLoading ? (
      <SkeletonLoader
        repeat={3}
        height={44}
        space={2}
        borderRadius="standard"
      />
    ) : (
      <CaseTableOverview cases={caseOverview.cases} />
    ),
  }))

  return (
    <Tabs
      onTabChange={(id) => setDepartment(id as DepartmentSlugEnum)}
      tabs={tabs || []}
      selectedTab={department ?? DepartmentSlugEnum.ADeild}
      label="Heildaryfirlit"
    />
  )
}

export default CasePublishedTabs
