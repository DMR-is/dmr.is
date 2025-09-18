'use client'

import useSWR from 'swr'

import {
  AlertMessage,
  Pagination,
  SkeletonLoader,
  Stack,
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
      }),
  )

  if (isLoading) {
    return (
      <SkeletonLoader
        repeat={5}
        height={124}
        borderRadius="large"
        space={[2, 3, 4]}
      />
    )
  }

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
      {data?.publications.map((publication) => (
        <PublicationCard key={publication.id} publication={publication} />
      ))}
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
    </Stack>
  )
}
