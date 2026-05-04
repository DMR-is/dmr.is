'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import {
  Case,
  CATEGORY_LABEL_TO_SLUG,
  CATEGORY_SLUG_MAP,
  COLUMN_EMPLOYEES,
  COLUMN_STATUS,
  COLUMNS,
  DETAIL_FIELDS,
} from '../../../app/(protected)/mal/mocks'
import { CaseFilter, CaseFilterState } from '../Filter/CaseFilter'

import { type ColumnDef } from '@tanstack/react-table'

const ExpandedRow = ({ row }: { row: Case }) => (
  <Box background="blue100" padding={2}>
    <Box display="flex" flexWrap="wrap" style={{ columnGap: 16 }}>
      {DETAIL_FIELDS.map(({ label, key }, index) => (
        <Box
          key={key}
          background={Math.floor(index / 2) % 2 === 0 ? 'white' : 'blue100'}
          paddingX={1}
          paddingY={1}
          style={{ flex: '0 0 calc(50% - 8px)' }}
        >
          <Box display="flex">
            <Box style={{ minWidth: 220 }}>
              <Text variant="small" fontWeight="semiBold">
                {label}
              </Text>
            </Box>
            <Text variant="small">{String(row[key])}</Text>
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)

const employeeRange = (value: string, count: number): boolean => {
  if (value === '1-25') return count >= 1 && count <= 25
  if (value === '26-50') return count >= 26 && count <= 50
  if (value === '51-100') return count >= 51 && count <= 100
  if (value === '101+') return count >= 101
  return false
}

const applyFilter = (data: Case[], filter: CaseFilterState): Case[] =>
  data.filter((row) => {
    if (filter.query) {
      const q = filter.query.toLowerCase()
      const searchable = Object.values(row).join(' ').toLowerCase()
      if (!searchable.includes(q)) return false
    }
    if (filter.category?.length && !filter.category.includes(row.category))
      return false
    if (filter.status?.length && !filter.status.includes(row.status ?? ''))
      return false
    if (
      filter.employees?.length &&
      !filter.employees.some((range) => employeeRange(range, row.employees))
    )
      return false
    if (filter.dateFrom || filter.dateTo) {
      const [d, m, y] = row.date.split('.')
      const rowDate = new Date(Number(y), Number(m) - 1, Number(d))
      if (filter.dateFrom && rowDate < filter.dateFrom) return false
      if (filter.dateTo && rowDate > filter.dateTo) return false
    }
    return true
  })

const PAGE_SIZE = 10

export type TabContentProps = {
  initialData: Case[]
  extraColumns?: ColumnDef<Case>[]
}

export const TabContent = ({ initialData, extraColumns }: TabContentProps) => {
  const columns = extraColumns ? [...COLUMNS, ...extraColumns] : COLUMNS
  const showStatusFilter = extraColumns?.includes(COLUMN_STATUS) ?? false
  const showEmployeesFilter = extraColumns?.includes(COLUMN_EMPLOYEES) ?? false
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filterState, setFilterState] = useState<CaseFilterState>(() => {
    const slugs = searchParams.getAll('category')
    const category = slugs
      .map((s) => CATEGORY_SLUG_MAP[s])
      .filter(Boolean) as string[]
    return { category: category.length ? category : undefined }
  })
  const [page, setPage] = useState(1)

  const handleChange = (key: keyof CaseFilterState, values?: string[]) => {
    setFilterState((prev) => ({ ...prev, [key]: values }))
    setPage(1)

    if (key === 'category') {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('category')
      values?.forEach((label) => {
        const slug = CATEGORY_LABEL_TO_SLUG[label]
        if (slug) params.append('category', slug)
      })
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }

  const handleQueryChange = (value: string) => {
    setFilterState((prev) => ({ ...prev, query: value || undefined }))
    setPage(1)
  }

  const handleDateChange = (key: 'dateFrom' | 'dateTo', value?: Date) => {
    setFilterState((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    setFilterState({})
    setPage(1)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const filtered = applyFilter(initialData, filterState)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Box marginTop={3}>
      <GridRow>
        <GridColumn span={['12/12', '3/12']}>
          <CaseFilter
            filterState={filterState}
            onChange={handleChange}
            onQueryChange={handleQueryChange}
            onDateChange={handleDateChange}
            onReset={handleReset}
            showStatusFilter={showStatusFilter}
            showEmployeesFilter={showEmployeesFilter}
          />
        </GridColumn>
        <GridColumn span={['12/12', '9/12']}>
          <Stack space={3}>
            <Inline space={1} alignY="center">
              <Text fontWeight="semiBold">{filtered.length}</Text>
              <Text>færslur fundust</Text>
            </Inline>
            <Table
              columns={columns}
              data={filtered}
              getRowExpanded={(row) => <ExpandedRow row={row} />}
              paging={{
                page,
                pageSize: PAGE_SIZE,
                totalItems: filtered.length,
                totalPages,
              }}
              onPageChange={setPage}
              showPageSizeSelect={false}
            />
          </Stack>
        </GridColumn>
      </GridRow>
    </Box>
  )
}
