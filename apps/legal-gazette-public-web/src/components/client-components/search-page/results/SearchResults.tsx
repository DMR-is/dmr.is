'use client'

import { useState } from 'react'

import {
  AlertMessage,
  Box,
  Breadcrumbs,
  Button,
  Checkbox,
  Inline,
  Pagination,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { PublishedPublicationDto } from '../../../../gen/fetch'
import { useFilters } from '../../../../hooks/useFilters'
import { usePublications } from '../../../../hooks/usePublications'
import { PublicationCard } from '../../cards/PublicationCard'

export const SearchResults = () => {
  const { filters, setFilters } = useFilters()
  const [advvertsSelected, setAdvertsSelected] = useState<
    PublishedPublicationDto[]
  >([])

  const { data, totalItems, isLoading, error } = usePublications()

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
          <Box>
            <Text variant="h2">Leit í Lögbirtingablaði</Text>
          </Box>
        </Stack>
        <Inline space={1} alignY="center" justifyContent="spaceBetween">
          {totalItems ? (
            <Text marginTop={1}>
              <strong>
                {filters.page > 1
                  ? filters.pageSize * (filters.page - 1) + 1
                  : 1}
              </strong>
              {' – '}
              <strong>
                {filters.page * filters.pageSize < totalItems
                  ? filters.page * filters.pageSize
                  : totalItems}
              </strong>
              {' af '}
              <strong>{totalItems}</strong> niðurstöðum
            </Text>
          ) : (
            <div></div>
          )}
          <Button
            variant="utility"
            onClick={() => setAdvertsSelected([])}
            icon="copy"
            iconType="outline"
          >
            Skoða sýnliegar auglýsingar
          </Button>
        </Inline>
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
