'use client'

import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'
import { useState } from 'react'

import { TextInput } from '@dmr.is/ui/components/Inputs/TextInput'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'

import { useTRPC } from '../../lib/trpc/client/trpc'
import { CreateCompanyModal } from './CreateCompanyModal'

import { useSuspenseQuery } from '@tanstack/react-query'

const EMPLOYEE_COUNT_OPTIONS = [
  { label: 'Sýna allt', value: 0 },
  { label: '50+', value: 50 },
  { label: '100+', value: 100 },
  { label: '150+', value: 150 },
  { label: '200+', value: 200 },
]

export const CompaniesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const [filters, setFilters] = useQueryStates({
    q: parseAsString.withDefault(''),
    minEmployeeCount: parseAsInteger.withDefault(0),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(10),
    sortBy: parseAsStringEnum<'name' | 'employeeCount'>([
      'name',
      'employeeCount',
    ]).withDefault('name'),
    direction: parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault(
      'asc',
    ),
  })

  const trpc = useTRPC()
  const { data } = useSuspenseQuery(
    trpc.company.list.queryOptions({
      q: filters.q || undefined,
      minEmployeeCount: filters.minEmployeeCount || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
      sortBy: filters.sortBy,
      direction: filters.direction,
    }),
  )

  const handleSearch = () => {
    setFilters({ q: searchInput || null, page: 1 })
  }

  const handleSort = (field: string) => {
    if (field !== 'name' && field !== 'employeeCount') return
    const isSameField = filters.sortBy === field
    setFilters({
      sortBy: field,
      direction: isSameField && filters.direction === 'asc' ? 'desc' : 'asc',
      page: 1,
    })
  }

  const columns = [
    {
      field: 'name' as const,
      children: 'Nafn',
      sortable: true,
      sortBy: filters.sortBy === 'name' ? filters.sortBy : undefined,
      direction: filters.sortBy === 'name' ? filters.direction : undefined,
      onSort: handleSort,
    },
    {
      field: 'nationalId' as const,
      children: 'Kennitala',
    },
    {
      field: 'employeeCount' as const,
      children: 'Meðalfjöldi starfsmanna',
      sortable: true,
      sortBy: filters.sortBy === 'employeeCount' ? filters.sortBy : undefined,
      direction:
        filters.sortBy === 'employeeCount' ? filters.direction : undefined,
      onSort: handleSort,
    },
  ] as const

  const hasActiveFilters = !!filters.q || filters.minEmployeeCount !== 0

  return (
    <Box marginTop={[3, 4]}>
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            <Stack space={3}>
              <Inline justifyContent="spaceBetween" alignY="center">
                <Text variant="h2">Fyrirtæki</Text>
                <Button
                  icon="add"
                  iconType="outline"
                  onClick={() => setIsModalOpen(true)}
                >
                  Nýtt fyrirtæki
                </Button>
              </Inline>

              <Inline space={2} alignY="bottom">
                <TextInput
                  name="search"
                  label="Leita"
                  placeholder="Nafn eða kennitala..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch()
                  }}
                />
                <Select
                  size="sm"
                  name="minEmployeeCount"
                  label="Fjöldi starfsfólks"
                  value={EMPLOYEE_COUNT_OPTIONS.find(
                    (o) => o.value === filters.minEmployeeCount,
                  )}
                  options={EMPLOYEE_COUNT_OPTIONS}
                  onChange={(opt) =>
                    setFilters({ minEmployeeCount: opt?.value ?? 0, page: 1 })
                  }
                />
                <Button variant="ghost" size="small" onClick={handleSearch}>
                  Leita
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => {
                      setSearchInput('')
                      setFilters({ q: null, minEmployeeCount: 0, page: 1 })
                    }}
                  >
                    Hreinsa síur
                  </Button>
                )}
              </Inline>

              <DataTable
                columns={columns}
                rows={(data?.companies ?? []).map((c) => ({
                  columns,
                  name: c.name,
                  nationalId: c.nationalId,
                  employeeCount: c.averageEmployeeCountFromRsk,
                }))}
                paging={
                  data?.paging
                    ? {
                        page: data.paging.page,
                        pageSize: data.paging.pageSize,
                        totalItems: data.paging.totalItems,
                        totalPages: data.paging.totalPages,
                      }
                    : undefined
                }
                onPageChange={(page) => setFilters({ page })}
                onPageSizeChange={(pageSize) =>
                  setFilters({ pageSize, page: 1 })
                }
                noDataMessage="Engin fyrirtæki skráð"
              />
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Box>
  )
}
