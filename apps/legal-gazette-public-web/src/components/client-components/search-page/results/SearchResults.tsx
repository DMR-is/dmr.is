'use client'

import { useState } from 'react'

import {
  AlertMessage,
  Box,
  Breadcrumbs,
  Button,
  Inline,
  Pagination,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { useFilters } from '../../../../hooks/useFilters'
import { usePublications } from '../../../../hooks/usePublications'
import { PublicationCard } from '../../cards/PublicationCard'
import { ViewPublicationsOnPage } from './ViewSearchedPublications'

export const SearchResults = () => {
  const { filters, setFilters } = useFilters()
  const { data, isLoading, error } = usePublications()

  const [showSelectedPublications, setShowSelectedPublications] =
    useState(false)

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
            <Button
              colorScheme="light"
              icon="documents"
              iconType="outline"
              variant="utility"
              onClick={() =>
                setShowSelectedPublications(!showSelectedPublications)
              }
              disabled={!data?.publications.length}
            >
              Skoða auglýsingar á síðu
            </Button>
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
      {showSelectedPublications && (
        <ViewPublicationsOnPage
          openModal={showSelectedPublications}
          setOpenModal={setShowSelectedPublications}
        />
      )}
    </>
  )
}
