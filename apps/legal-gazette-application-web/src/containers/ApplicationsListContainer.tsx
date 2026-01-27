'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

import { Stack } from '@island.is/island-ui/core'

import {
  ApplicationFilters,
  mapStatusToEnum,
  mapTypeToEnum,
} from '../components/application/ApplicationFilters'
import { ApplicationList } from '../components/application/ApplicationList'
import { useApplicationFilters } from '../hooks/useApplicationFilters'
import { useTRPC } from '../lib/trpc/client/trpc'

export function ApplicationsListContainer() {
  const trpc = useTRPC()

  const { params, updateParams } = useApplicationFilters()

  const { data, isLoading, error } = useQuery(
    trpc.getApplications.queryOptions({
      page: params.page,
      pageSize: params.pageSize,
      dateFrom: params.dateFrom ? params.dateFrom.toISOString() : undefined,
      dateTo: params.dateTo ? params.dateTo.toISOString() : undefined,
      search: params.search || undefined,
      type: mapTypeToEnum(params.type),
      status: mapStatusToEnum(params.status),
      sortBy: params.sortBy || undefined,
      direction: params.direction || undefined,
    }),
  )

  return (
    <Box background={'blue100'} paddingTop={[3, 5]} paddingBottom={[6, 8]}>
      <GridContainer>
        <GridRow marginTop={0} marginBottom={[4, 6]}>
          <GridColumn
            span={['12/12', '12/12', '12/12', '4/12', '3/12']}
            position="relative"
          >
            <Stack space={2}>
              <Box position="sticky" top={[3, 4]} marginTop={1}>
                <ApplicationFilters />
              </Box>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '12/12', '8/12', '9/12']}>
            <ApplicationList
              isLoading={isLoading}
              applications={data?.applications}
              paging={data?.paging}
              error={
                error
                  ? 'Ekki náðist samband við vefþjón eða hann gat ekki svarað beiðninni'
                  : undefined
              }
              onPageChange={(page) => updateParams({ page })}
            />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
