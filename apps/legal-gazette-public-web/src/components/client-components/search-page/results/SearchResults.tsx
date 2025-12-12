'use client'

import { useEffect } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  AlertMessage,
  Box,
  Breadcrumbs,
  Pagination,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useTotalItemsContext } from '../../../../context/total-items-context'
import { useFilters } from '../../../../hooks/useFilters'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { PublicationCard } from '../../cards/PublicationCard'

export const SearchResults = () => {
  const { filters, setFilters } = useFilters()
  const { setTotalItems } = useTotalItemsContext()
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

  useEffect(() => {
    setTotalItems(data?.paging.totalItems)
  }, [data])

  const breadcrumbs = [
    {
      title: 'Lögbirtingarblað',
      href: '/',
    },
    {
      title: 'Auglýsingar',
    },
  ]

  return (
    <>
      <Stack space={[2]}>
        <Stack space={[1]}>
          <Breadcrumbs items={breadcrumbs} />
          <Box>
            <Text marginBottom={[1]} variant="h2">
              Leit í Lögbirtingablaði
            </Text>
          </Box>
        </Stack>
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
    </>
  )
}
