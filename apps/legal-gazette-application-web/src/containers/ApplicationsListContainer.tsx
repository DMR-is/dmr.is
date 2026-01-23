'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

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
    <GridContainer>
      <GridRow marginBottom={[2, 3]}>
        <GridColumn span="12/12">
          <Button size="small" variant="text" icon="arrowForward">
            Eldri auglýsingar
          </Button>
        </GridColumn>
      </GridRow>
      <GridRow marginBottom={[4, 6]}>
        <GridColumn span={['12/12', '4/12']} position="relative">
          <Box
            position="sticky"
            top={[3, 4]}
            background="blue100"
            borderRadius="large"
            padding={[2, 3]}
          >
            <ApplicationFilters />
          </Box>
        </GridColumn>
        <GridColumn span={['0', '8/12']}>
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
  )
}
