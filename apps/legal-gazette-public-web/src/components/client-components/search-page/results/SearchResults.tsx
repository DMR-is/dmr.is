'use client'

import {
  AlertMessage,
  Box,
  Breadcrumbs,
  Inline,
  Pagination,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { CombinedHTMLModalContainer } from '../../../../containers/CombinedHTMLModalContainer'
import { useFilters } from '../../../../hooks/useFilters'
import { usePublications } from '../../../../hooks/usePublications'
import { PublicationCard } from '../../cards/PublicationCard'

export const SearchResults = () => {
  const { filters, setFilters } = useFilters()
  const { data, isLoading, error } = usePublications()

  if (error) {
    return (
      <AlertMessage
        type="error"
        title="Villa kom upp"
        message="Ekki tókst að sækja birtingar, vinsamlegast reynið aftur síðar"
      />
    )
  }

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
          <Inline space={2} alignY="center" justifyContent="spaceBetween">
            <Text variant="h2">Leit í Lögbirtingablaði</Text>

            <CombinedHTMLModalContainer
              disabled={!data?.publications.length}
              pagingInfo={{
                paging: {
                  page: filters.page,
                  pageSize: filters.pageSize,
                },

                totalItems: data?.paging.totalItems,
              }}
            />
          </Inline>
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
