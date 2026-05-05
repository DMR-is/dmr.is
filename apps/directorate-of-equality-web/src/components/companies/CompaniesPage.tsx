'use client'

import { useMemo, useState } from 'react'

import { useSuspenseQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Filter } from '@dmr.is/ui/components/island-is/Filter'
import { FilterInput } from '@dmr.is/ui/components/island-is/FilterInput'
import { FilterMultiChoice } from '@dmr.is/ui/components/island-is/FilterMultiChoice'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { useTRPC } from '../../lib/trpc/client/trpc'
import { CreateCompanyModal } from './CreateCompanyModal'

type CompanyRow = {
  name: string
  nationalId: string
  employees: number
}

const COLUMNS: ColumnDef<CompanyRow>[] = [
  { accessorKey: 'name', header: 'Nafn', enableSorting: true },
  { accessorKey: 'nationalId', header: 'Kennitala', enableSorting: false },
  {
    accessorKey: 'employees',
    header: 'Meðalfjöldi starfsmanna',
    enableSorting: true,
  },
]

const EMPLOYEE_RANGES = [
  { value: '1-50', label: '1–50' },
  { value: '51-100', label: '51–100' },
  { value: '101-200', label: '101–200' },
  { value: '201+', label: '201+' },
]

const inRange = (count: number, range: string): boolean => {
  if (range === '1-50') return count >= 1 && count <= 50
  if (range === '51-100') return count >= 51 && count <= 100
  if (range === '101-200') return count >= 101 && count <= 200
  if (range === '201+') return count >= 201
  return false
}

const PAGE_SIZE = 10

export const CompaniesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [employeeRanges, setEmployeeRanges] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const trpc = useTRPC()
  const { data } = useSuspenseQuery(
    trpc.company.list.queryOptions({ pageSize: 1000 }),
  )

  const rows = useMemo<CompanyRow[]>(() => {
    const all = (data?.companies ?? []).map((c) => ({
      name: c.name,
      nationalId: c.nationalId,
      employees: c.averageEmployeeCountFromRsk,
    }))

    return all.filter((row) => {
      if (query) {
        const q = query.toLowerCase()
        if (
          !row.name.toLowerCase().includes(q) &&
          !row.nationalId.includes(q)
        ) {
          return false
        }
      }
      if (
        employeeRanges.length &&
        !employeeRanges.some((r) => inRange(row.employees, r))
      ) {
        return false
      }
      return true
    })
  }, [data, query, employeeRanges])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageData = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleReset = () => {
    setQuery('')
    setEmployeeRanges([])
    setPage(1)
  }

  return (
    <Box marginTop={[3, 4]}>
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            <Box display="flex" justifyContent="spaceBetween" alignItems="center" marginBottom={3}>
              <Text variant="h2">Fyrirtæki</Text>
              <Button
                icon="add"
                iconType="outline"
                onClick={() => setIsModalOpen(true)}
              >
                Nýtt fyrirtæki
              </Button>
            </Box>
          </GridColumn>

          <GridColumn span={['12/12', '3/12']}>
            <Text variant="h5" fontWeight="semiBold" marginBottom={2}>
              Leit og síun
            </Text>
            <Filter
              labelClearAll="Hreinsa allar síur"
              labelOpen="Opna síur"
              labelClose="Loka síum"
              labelClear="Hreinsa"
              labelTitle="Síur"
              labelResult="Sýna niðurstöður"
              onFilterClear={handleReset}
              variant="default"
              filterInput={
                <FilterInput
                  name="query"
                  placeholder="Leita að fyrirtæki..."
                  value={query}
                  onChange={(val) => {
                    setQuery(val)
                    setPage(1)
                  }}
                  backgroundColor="white"
                />
              }
            >
              <FilterMultiChoice
                labelClear="Hreinsa"
                onChange={({ categoryId, selected }) => {
                  if (categoryId === 'employees') {
                    setEmployeeRanges(selected)
                    setPage(1)
                  }
                }}
                onClear={(categoryId) => {
                  if (categoryId === 'employees') {
                    setEmployeeRanges([])
                    setPage(1)
                  }
                }}
                categories={[
                  {
                    id: 'employees',
                    label: 'Starfsmenn',
                    selected: employeeRanges,
                    filters: EMPLOYEE_RANGES,
                  },
                ]}
              />
            </Filter>
          </GridColumn>

          <GridColumn span={['12/12', '9/12']}>
            <Stack space={3}>
              <Box display="flex" alignItems="center" columnGap={1}>
                <Text fontWeight="semiBold">{rows.length}</Text>
                <Text>fyrirtæki fundust</Text>
              </Box>
              <Table
                columns={COLUMNS}
                data={pageData}
                paging={{
                  page,
                  pageSize: PAGE_SIZE,
                  totalItems: rows.length,
                  totalPages,
                }}
                onPageChange={setPage}
                showPageSizeSelect={false}
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
