'use client'

import { useEffect, useState } from 'react'

import {
  Box,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { Icon, Link } from '@island.is/island-ui/core'

import { useFilters } from '../../../../hooks/useFilters'
import { issues } from '../dummyData'

export const SearchIssuesResults = ({
  setTotalItems,
}: {
  setTotalItems: (count: number) => void
}) => {
  const { filters, setFilters } = useFilters()
  const [isLoading, setIsLoading] = useState(false)

  const getFilteredData = () => {
    let thisData = [...issues]
    if (filters.dateFrom && filters.dateTo) {
      thisData = thisData.filter((issue) => {
        if (issue.date < filters.dateFrom! || issue.date > filters.dateTo!) {
          return false
        }
        return true
      })
    } else {
      thisData = thisData.filter((issue) => {
        if (issue.date.getFullYear() !== filters.yearId) {
          return false
        }
        return true
      })
    }
    setTotalItems(thisData.length)
    return {
      data: thisData.filter((issue, index) => {
        if (
          index >= (filters.page - 1) * filters.pageSize &&
          index < filters.page * filters.pageSize
        ) {
          return true
        }
        return false
      }),

      paging: {
        pageSize: filters.pageSize,
        totalPages:
          filters.pageSize > 0
            ? Math.ceil(thisData.length / filters.pageSize)
            : 1,
        page: filters.page,
        totalItems: thisData.length,
      },
    }
  }
  const [filteredData, setFilteredData] = useState(getFilteredData())

  useEffect(() => {
    // console.log('changed', data.amount)
    setFilteredData(getFilteredData())
  }, [filters])

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
      ) : (filteredData.data?.length || 0) > 0 ? (
        <Box paddingBottom={3} borderRadius="large">
          <DataTable
            paging={filteredData.paging}
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
                width: '150px',
              },
            ]}
            rows={
              filteredData.data?.map((publication) => ({
                nr: publication.nr,
                date: publication.date.toLocaleDateString('en-GB'),
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
        <Box padding={[2, 3, 4]} borderRadius="md" background={'white'}>
          <Text variant="h3">Engin tölublöð fundust</Text>
          <Text>Vinsamlegast endurskoðaðu síunar</Text>
        </Box>
      )}
    </Stack>
  )
}
