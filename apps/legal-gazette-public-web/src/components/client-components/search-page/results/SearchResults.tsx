'use client'

import useSWR from 'swr'

import {
  AlertMessage,
  Box,
  Pagination,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useClient } from '../../../../hooks/useClient'
import { useFilters } from '../../../../hooks/useFilters'
import { PublicationCard } from '../../cards/PublicationCard'

export const SearchResults = () => {
  const client = useClient()
  const { filters, setFilters } = useFilters()

  const { data, isLoading, error } = useSWR(
    ['getPublications', filters],
    ([_key, params]) =>
      client.getPublications({
        page: params.page,
        pageSize: params.pageSize,
        typeId: params.typeId ?? undefined,
        categoryId:
          params.categoryId.length > 0 ? params.categoryId : undefined,
        search: params.search ?? undefined,
        dateFrom: params.dateFrom?.toISOString(),
        dateTo: params.dateTo?.toISOString(),
      }),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
    },
  )

  if (error) {
    return (
      <AlertMessage
        type="error"
        title="Villa kom upp"
        message="Ekki tókst að sækja birtingar, vinsamlegast reynið aftur síðar"
      />
    )
  }

  if (isLoading) {
    return (
      <SkeletonLoader
        height={230}
        borderRadius="large"
        repeat={5}
        space={[2, 3, 4]}
      />
    )
  }

  return (
    <Stack space={[2, 3, 4]}>
      {data?.publications.map((publication) => (
        <PublicationCard key={publication.id} publication={publication} />
      ))}
      {(data?.paging.totalItems || 0) > 0 && (
        <Pagination
          page={filters.page}
          itemsPerPage={filters.pageSize}
          totalItems={data?.paging.totalItems}
          totalPages={data?.paging.totalPages}
          renderLink={(page, className, children) => (
            <button
              className={className}
              onClick={() => setFilters((prev) => ({ ...prev, page }))}
            >
              {children}
            </button>
          )}
        />
      )}
      {data?.publications.length === 0 && (
        <Box padding={[2, 3, 4]} borderRadius="large" border="standard">
          <Text variant="h3">Engar birtingar fundust</Text>
          <Text>Vinsamlegast endurskoðaðu leitarskilyrði</Text>
        </Box>
      )}
    </Stack>
  )
}
