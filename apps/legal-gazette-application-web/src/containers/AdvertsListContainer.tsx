'use client'

import { parseAsInteger, useQueryState } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  AlertMessage,
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
} from '@dmr.is/ui/components/island-is'

import { MyAdvertsList } from '../components/adverts/MyAdvertsList'
import { useTRPC } from '../lib/trpc/client/trpc'

export function AdvertsListContainer() {
  const trpc = useTRPC()
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))

  const { data, isLoading, error } = useQuery(
    trpc.getMyLegacyAdverts.queryOptions({
      page: page,
    }),
  )

  if (isLoading) {
    return (
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            <SkeletonLoader
              repeat={3}
              height={200}
              borderRadius="large"
              space={3}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    )
  }

  if (error) {
    return (
      <AlertMessage
        type="error"
        title="Villa við að sækja auglýsingar"
        message="Vinsamlegast reynið aftur síðar"
      />
    )
  }

  if (!data) {
    return <AlertMessage type="info" title="Engar auglýsingar fundust" />
  }

  return (
    <MyAdvertsList
      adverts={data.adverts ?? []}
      paging={data.paging}
      onPageChange={setPage}
    />
  )
}
