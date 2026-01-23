'use client'
import debounce from 'lodash/debounce'
import {
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'
import { useCallback } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
} from '@dmr.is/ui/components/island-is'

import { ApplicationFilters } from '../components/application/ApplicationFilters'
import { ApplicationList } from '../components/application/ApplicationList'
import {
  ApplicationStatusEnum,
  ApplicationTypeEnum,
  SortDirectionEnum,
} from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

export function ApplicationsListContainer() {
  const trpc = useTRPC()

  const [params, setParams] = useQueryStates({
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(5),
    sortBy: parseAsString,
    direction: parseAsStringEnum(Object.values(SortDirectionEnum)),
    dateFrom: parseAsIsoDate,
    dateTo: parseAsIsoDate,
    type: parseAsString,
    status: parseAsString,
  })

  const { data, isLoading, error } = useQuery(
    trpc.getApplications.queryOptions({
      page: params.page,
      pageSize: params.pageSize,
      dateFrom: params.dateFrom ? params.dateFrom.toISOString() : undefined,
      dateTo: params.dateTo ? params.dateTo.toISOString() : undefined,
      search: params.search || undefined,
      type: params.type ? (params.type as ApplicationTypeEnum) : undefined,
      status: params.status
        ? (params.status as ApplicationStatusEnum)
        : undefined,
      sortBy: params.sortBy || undefined,
      direction: params.direction || undefined,
    }),
  )

  const onSearchChange = useCallback(
    debounce((val) => {
      setParams({ search: val, page: 1 })
    }, 300),
    [],
  )

  const onSearchHandler = (val: string) => {
    onSearchChange.cancel()
    onSearchChange(val)
  }

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
            <ApplicationFilters
              onSearchChange={onSearchHandler}
              onTypeChange={(val) => setParams({ type: val, page: 1 })}
              onStatusChange={(val) => setParams({ status: val, page: 1 })}
              onDateFromChange={(date) =>
                setParams({ dateFrom: date, page: 1 })
              }
              onDateToChange={(date) => setParams({ dateTo: date, page: 1 })}
              onSortByChange={(val) => setParams({ sortBy: val, page: 1 })}
              onPageSizeChange={(val) => setParams({ pageSize: val, page: 1 })}
              onResetFilters={() =>
                setParams({
                  search: '',
                  page: 1,
                  pageSize: 5,
                  sortBy: '',
                  direction: undefined,
                  dateFrom: undefined,
                  dateTo: undefined,
                  type: '',
                  status: '',
                })
              }
            />
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
            onPageChange={(page) => setParams({ page })}
          />
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
