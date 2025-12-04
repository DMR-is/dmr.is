'use client'

import { use, useEffect, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import {
  Box,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { Icon, Link } from '@island.is/island-ui/core'

import { useFilters } from '../../../../hooks/useFilters'
import { useTRPC } from '../../../../lib/trpc/client/trpc'

export const SearchIssuesResults = ({
  setTotalItems,
}: {
  setTotalItems: (count: number) => void
}) => {
  const { filters, setFilters } = useFilters()

  const trpc = useTRPC()

  const { data, isLoading } = useQuery(
    trpc.getIssues.queryOptions({
      page: filters.page,
      pageSize: filters.pageSize,
      year:
        filters.dateFrom && filters.dateTo
          ? undefined
          : filters.yearId.toString(),
      dateFrom: filters.dateFrom
        ? new Date(filters.dateFrom).toISOString()
        : undefined,
      dateTo: filters.dateTo
        ? new Date(filters.dateTo).toISOString()
        : undefined,
    }),
  )

  useEffect(() => {
    if (data?.paging.totalItems) {
      setTotalItems(data.paging.totalItems)
    }
  }, [data])

  return (
    <Stack space={[2, 3, 4]}>
      {isLoading ? (
        <SkeletonLoader
          height={230}
          borderRadius="large"
          repeat={5}
          space={[2, 3, 4]}
        />
      ) : (data?.issues?.length || 0) > 0 ? (
        <Box paddingBottom={3} borderRadius="large">
          <DataTable
            paging={data?.paging}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) =>
              setFilters((prev) => ({ ...prev, pageSize, page: 1 }))
            }
            showPageSizeSelect={false}
            tableBackground="white"
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
                width: '18%',
              },
            ]}
            rows={
              data?.issues?.map((issue) => ({
                nr: issue.issue,
                date: new Date(issue.publishDate).toLocaleDateString('en-GB'),
                link: (
                  <Link
                    href={issue.url}
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
        <Box padding={[2, 3, 4]} borderRadius="md" background={'white'}>
          <Text variant="h3">Engin tölublöð fundust</Text>
          <Text>Vinsamlegast endurskoðaðu síunar</Text>
        </Box>
      )}
    </Stack>
  )
}
