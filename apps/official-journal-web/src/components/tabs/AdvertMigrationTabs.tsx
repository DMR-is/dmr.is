import { useEffect } from 'react'

import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useAdverts } from '../../hooks/api/get/useAdverts'
import { useSearchParams } from '../../hooks/useSearchParams'
import AdvertMigrationTable from '../tables/AdvertMigrationTable'

export const AdvertMigrationTabs = () => {
  const [searchParams] = useSearchParams()
  const { search, page, pageSize } = searchParams

  const { data, isLoading, mutate } = useAdverts({
    params: {
      page: page ?? 1,
      pageSize: pageSize ?? 20,
      search: search ?? '',
    },
  })

  useEffect(() => {
    async function refetch() {
      await mutate()
    }
    refetch()
  }, [search, page, mutate])

  return (
    <Stack space={[2, 2, 3]}>
      {search && (
        <AdvertMigrationTable
          adverts={data?.adverts}
          isLoading={isLoading}
          paging={data?.paging}
        />
      )}
      {!search && (
        <Text variant="h5">
          {`Leitaðu eftir nafni eða skráningarnúmeri auglýsingar til að flytja í ritstjórnarkerfi`}
        </Text>
      )}
    </Stack>
  )
}

export default AdvertMigrationTabs
