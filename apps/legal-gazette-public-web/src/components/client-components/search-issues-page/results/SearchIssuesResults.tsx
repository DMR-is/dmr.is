'use client'

import { useState } from 'react'

import {
  AlertMessage,
  Box,
  Pagination,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { Icon, Link } from '@island.is/island-ui/core'

import { useFilters } from '../../../../hooks/useFilters'
import { useTRPC } from '../../../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

export const SearchIssuesResults = () => {
  const { filters, setFilters } = useFilters()
  const trpc = useTRPC()

  const [isLoading, setIsLoading] = useState(false)

  // const { data, isLoading, error } = useQuery(
  //   trpc.getPublications.queryOptions({
  //     page: filters.page,
  //     pageSize: filters.pageSize,
  //     search: filters.search,
  //     categoryId: filters.categoryId ?? undefined,
  //     typeId: filters.typeId ?? undefined,
  //     dateFrom: filters.dateFrom
  //       ? new Date(filters.dateFrom).toISOString()
  //       : undefined,
  //     dateTo: filters.dateTo
  //       ? new Date(filters.dateTo).toISOString()
  //       : undefined,
  //   }),
  // )

  const data = [
    {
      nr: 37,
      date: '19.11.2025',
      link: '/auglysingar?type=innkollun-throtabu',
    },
    {
      nr: 36,
      date: '18.11.2025',
      link: '/auglysingar?type=innkollun-throtabu',
    },
    {
      nr: 35,
      date: '14.11.2025',
      link: '/auglysingar?type=innkollun-throtabu',
    },
    {
      nr: 34,
      date: '15.10.2025',
      link: '/auglysingar?type=innkollun-throtabu',
    },
    {
      nr: 33,
      date: '15.10.2025',
      link: '/auglysingar?type=innkollun-throtabu',
    },
  ]

  // if (error) {
  //   return (
  //     <AlertMessage
  //       type="error"
  //       title="Villa kom upp"
  //       message="Ekki tókst að sækja birtingar, vinsamlegast reynið aftur síðar"
  //     />
  //   )
  // }

  return (
    <Stack space={[2, 3, 4]}>
      {isLoading ? (
        <SkeletonLoader
          height={230}
          borderRadius="large"
          repeat={5}
          space={[2, 3, 4]}
        />
      ) : (data?.length || 0) > 0 ? (
        <Box background={'white'} paddingBottom={3} borderRadius="large">
          <DataTable
            paging={{
              pageSize: 3,
              totalPages: 2,
              page: 1,
              totalItems: 6,
            }}
            headerBackground="#ccdfff"
            showPageSizeSelect={false}
            columns={[
              {
                field: 'nr',
                children: 'Tbl.nr.',
              },
              {
                field: 'date',
                children: 'Útg.dagur',
                name: 'date',
              },
              {
                field: 'link',
                children: 'Útgáfusnið',
                width: '150px',
              },
            ]}
            rows={
              data?.map((publication) => ({
                nr: publication.nr,
                date: publication.date,
                link: (
                  <Link
                    href={publication.link ?? ''}
                    underline="small"
                    underlineVisibility="hover"
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'bottom',
                        gap: '3px',
                      }}
                    >
                      <Icon icon="document" type="outline" size="small" />
                      Sækja pdf
                    </span>
                  </Link>
                ),
              })) || []
            }
          />
        </Box>
      ) : (
        <Box padding={[2, 3, 4]} borderRadius="large" border="standard">
          <Text variant="h3">Engar birtingar fundust</Text>
          <Text>Vinsamlegast endurskoðaðu leitarskilyrði</Text>
        </Box>
      )}
      {/* {(data?.paging.totalItems || 0) > 0 && (
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
      )} */}
    </Stack>
  )
}
