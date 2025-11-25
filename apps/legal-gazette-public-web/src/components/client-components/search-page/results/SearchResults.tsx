'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  AlertMessage,
  Box,
  Pagination,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useFilters } from '../../../../hooks/useFilters'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { PublicationCard } from '../../cards/PublicationCard'

export const SearchResults = () => {
  const { filters, setFilters } = useFilters()
  const trpc = useTRPC()

  const { data, isLoading, error } = useQuery(
    trpc.getPublications.queryOptions({
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search,
      categoryId: filters.categoryId ?? undefined,
      typeId: filters.typeId ?? undefined,
      dateFrom: filters.dateFrom
        ? new Date(filters.dateFrom).toISOString()
        : undefined,
      dateTo: filters.dateTo
        ? new Date(filters.dateTo).toISOString()
        : undefined,
    }),
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

  return (
    <Stack space={[2, 3, 4]}>
      <Box>
        <Text marginBottom={[2, 3]} variant="h1">
          Leit í lögbirtingablaðinu
        </Text>
        <Text>
          Um útgáfu Lögbirtingablaðsins gilda lög um Stjórnartíðindi og
          Lögbirtingablað nr. 15/2005.
        </Text>
      </Box>
      {isLoading ? (
        <SkeletonLoader
          height={230}
          borderRadius="large"
          repeat={5}
          space={[2, 3, 4]}
        />
      ) : (data?.publications.length || 0) > 0 ? (
        data?.publications.map((publication) => (
          <PublicationCard key={publication.id} publication={publication} />
        ))
      ) : (
        <Box padding={[2, 3, 4]} borderRadius="large" border="standard">
          <Text variant="h3">Engar birtingar fundust</Text>
          <Text>Vinsamlegast endurskoðaðu leitarskilyrði</Text>
        </Box>
      )}
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
    </Stack>
  )
}
