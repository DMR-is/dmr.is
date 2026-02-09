'use client'

import { parseAsInteger, useQueryState } from 'nuqs'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { OldAdvertsList } from '../components/adverts/OldAdvertsList'
import { useTRPC } from '../lib/trpc/client/trpc'

export function OldAdvertsListContainer() {
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
        <GridRow marginTop={3}>
          <GridColumn
            span={['12/12', '12/12', '12/12', '12/12', '10/12']}
            offset={['0', '0', '0', '0', '1/12']}
          >
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

  if (!data || data.adverts.length === 0) {
    return (
      <GridContainer>
        <GridRow marginTop={3}>
          <GridColumn
            span={['12/12', '12/12', '12/12', '12/12', '10/12']}
            offset={['0', '0', '0', '0', '1/12']}
          >
            <Box background={'white'} borderRadius="large" padding={[4, 5]}>
              <Stack space={1}>
                <Text variant="h3">Engar eldri auglýsingar fundust</Text>
                <Text>
                  Engar auglýsingar fundust úr eldri kerfum, birtar fyrir 17.
                  janúar 2026
                </Text>
              </Stack>
            </Box>
          </GridColumn>
        </GridRow>
      </GridContainer>
    )
  }

  return (
    <OldAdvertsList
      adverts={data.adverts ?? []}
      paging={data.paging}
      onPageChange={setPage}
    />
  )
}
