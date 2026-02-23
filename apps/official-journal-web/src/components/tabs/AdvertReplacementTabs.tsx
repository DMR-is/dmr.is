'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { useSearchParams } from '../../hooks/useSearchParams'
import { useTRPC } from '../../lib/trpc/client/trpc'
import AdvertPDFTable from '../tables/AdvertPDFTable'

export const AdvertReplacementTabs = () => {
  const [searchParams] = useSearchParams()
  const { search, page, pageSize } = searchParams

  const trpc = useTRPC()
  const { data, isLoading } = useQuery(
    trpc.getAdverts.queryOptions({
      page: page ?? 1,
      pageSize: pageSize ?? 20,
      search: search ?? '',
    }),
  )

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
