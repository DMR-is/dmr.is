import { parseAsStringEnum, useQueryState } from 'next-usequerystate'

import { Stack, Text } from '@island.is/island-ui/core'

import { DepartmentEnum } from '../../gen/fetch'
import { useAdverts } from '../../hooks/api/get/useAdverts'
import { useSearchParams } from '../../hooks/useSearchParams'
import AdvertPDFTable from '../tables/AdvertPDFTable'
import { Tabs } from './Tabs'

export const AdvertReplacementTabs = () => {
  const [searchParams] = useSearchParams()
  const { department: _department, status: _status } = searchParams

  const [department, setDepartment] = useQueryState(
    'department',
    parseAsStringEnum<DepartmentEnum>(
      Object.values(DepartmentEnum),
    ).withDefault(DepartmentEnum.ADeild),
  )

  const { data: adverts, isLoading: isLoading } = useAdverts({})
  console.log(isLoading)
  const departmentFiltered = adverts?.adverts?.filter(
    (x) => x.department.id === department,
  )
  const tabs = departmentFiltered?.map((advert) => ({
    id: advert.id,
    label: `${advert.department.title} (${departmentFiltered.length})`,
    content: (
      <Stack space={[2, 2, 3]}>
        <Text variant="h5">{`Útgefnar auglýsingar í ${department}:`}</Text>
        <AdvertPDFTable adverts={departmentFiltered} isLoading={isLoading} />
      </Stack>
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

export default AdvertReplacementTabs
