import { useEffect } from 'react'

import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useAdverts } from '../../hooks/api/get/useAdverts'
import { useSearchParams } from '../../hooks/useSearchParams'
import AdvertPDFTable from '../tables/AdvertPDFTable'

export const AdvertReplacementTabs = () => {
  const [searchParams] = useSearchParams()
  const { status: _status, search, page, pageSize, ...rest } = searchParams

  const {
    data,
    isLoading: isLoading,
    mutate,
  } = useAdverts({
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
  }, [search, page])

  return (
    <Stack space={[2, 2, 3]}>
      {search && (
        <AdvertPDFTable
          adverts={data?.adverts}
          isLoading={isLoading}
          paging={data?.paging}
        />
      )}
      {!search && (
        <Text variant="h5">
          {`Leitaðu eftir nafni eða skráningarnúmeri auglýsingar til að sjá útgefnar auglýsingar`}
        </Text>
      )}
    </Stack>
  )
}

export default AdvertReplacementTabs
