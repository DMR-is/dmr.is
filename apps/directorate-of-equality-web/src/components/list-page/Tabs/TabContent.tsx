'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { useMemo, useState } from 'react'
import { type z } from 'zod'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import { MOCK_DATA } from '../../../app/(protected)/mal/mocks'
// TODO: restore when dev data is seeded
// import { type ReportListItemDto } from '../../../gen/fetch/types.gen'
// import { useReportsFilter } from '../../../hooks/useReportsFilter'
// import { useTRPC } from '../../../lib/trpc/client/trpc'
// import { useQuery } from '@tanstack/react-query'
import { type zListReportsQuery } from '../../../gen/fetch/zod.gen'
import {
  type Case,
  CATEGORY_LABEL_TO_SLUG,
  CATEGORY_SLUG_MAP,
  COLUMN_STATUS,
  COLUMNS,
  DETAIL_FIELDS,
} from '../constants'
import { CaseFilter, CaseFilterState } from '../Filter/CaseFilter'
import * as styles from './TabContent.css'

import { type ColumnDef } from '@tanstack/react-table'

type ListReportsQuery = z.infer<typeof zListReportsQuery>

// TODO: restore when dev data is seeded
// const TYPE_TO_CATEGORY: Record<string, string> = {
//   EQUALITY: 'Jafnréttisáætlun',
//   SALARY: 'Launagreining',
// }

const STATUS_TO_ICELANDIC: Record<string, string> = {
  DRAFT: 'Drög',
  SUBMITTED: 'Innsent',
  IN_REVIEW: 'Í vinnslu',
  DENIED: 'Hafnað',
  APPROVED: 'Samþykkt',
  SUPERSEDED: 'Úrelt',
}

// TODO: restore when dev data is seeded
// function mapReportToCase(report: ReportListItemDto): Case {
//   const reviewer = report.reviewer
//     ? `${report.reviewer.firstName} ${report.reviewer.lastName}`.trim()
//     : ''
//   return {
//     id: report.id,
//     identifier: report.identifier ?? null,
//     date: report.createdAt
//       ? new Date(report.createdAt).toLocaleDateString('is-IS')
//       : '',
//     type: TYPE_TO_CATEGORY[report.type] ?? report.type,
//     company: report.companyName ?? '',
//     kennitala: report.companyNationalId ?? '',
//     status: STATUS_TO_ICELANDIC[report.status] ?? report.status,
//     reviewer,
//     correctionDeadline: report.correctionDeadline
//       ? new Date(report.correctionDeadline).toLocaleDateString('is-IS')
//       : null,
//     validUntil: report.validUntil
//       ? new Date(report.validUntil).toLocaleDateString('is-IS')
//       : null,
//   }
// }

const ExpandedRow = ({ row }: { row: Case }) => (
  <Box background="blue100" padding={2}>
    <div className={styles.expandedRowGrid}>
      {DETAIL_FIELDS.map(({ label, key }, index) => (
        <Box
          key={key}
          background={Math.floor(index / 2) % 2 === 0 ? 'white' : 'blue100'}
          paddingX={1}
          paddingY={1}
          className={styles.expandedRowItem}
        >
          <Box display="flex">
            <div className={styles.expandedRowLabel}>
              <Text variant="small" fontWeight="semiBold">
                {label}
              </Text>
            </div>
            <Text variant="small">{String(row[key])}</Text>
          </Box>
        </Box>
      ))}
    </div>
  </Box>
)

const applyFilter = (data: Case[], filter: CaseFilterState): Case[] =>
  data.filter((row) => {
    if (filter.query) {
      const q = filter.query.toLowerCase()
      const searchable = Object.values(row).join(' ').toLowerCase()
      if (!searchable.includes(q)) return false
    }
    if (filter.category?.length && !filter.category.includes(row.type))
      return false
    if (filter.status?.length && !filter.status.includes(row.status))
      return false
    if (filter.dateFrom || filter.dateTo) {
      // date field format is DD.MM.YYYY
      const [d, m, y] = row.date.split('.')
      const rowDate = new Date(Number(y), Number(m) - 1, Number(d))
      if (filter.dateFrom && rowDate < filter.dateFrom) return false
      if (filter.dateTo && rowDate > filter.dateTo) return false
    }
    return true
  })

const PAGE_SIZE = 10

export type TabContentProps = {
  fixedQuery?: Partial<ListReportsQuery>
  extraColumns?: ColumnDef<Case>[]
  expandable?: boolean
}

export const TabContent = ({
  fixedQuery,
  extraColumns,
  expandable,
}: TabContentProps) => {
  const columns = extraColumns ? [...COLUMNS, ...extraColumns] : COLUMNS
  const showStatusFilter = extraColumns?.includes(COLUMN_STATUS) ?? false
  const router = useRouter()
  const searchParams = useSearchParams()

  // TODO: restore when dev data is seeded
  // const trpc = useTRPC()
  // const { query } = useReportsFilter()
  // const mergedQuery: ListReportsQuery = { ...query, ...fixedQuery }
  // const { data } = useQuery(trpc.reports.list.queryOptions(mergedQuery))
  // const cases = useMemo(() => data?.reports.map(mapReportToCase) ?? [], [data])

  const cases = useMemo(() => {
    if (!fixedQuery?.status?.length) return MOCK_DATA
    const allowed = new Set(
      fixedQuery.status.map((s) => STATUS_TO_ICELANDIC[s] ?? s),
    )
    return MOCK_DATA.filter((c) => allowed.has(c.status))
  }, [fixedQuery])

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

  const filtered = useMemo(
    () => applyFilter(cases, filterState),
    [cases, filterState],
  )
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
              data={pageData}
              getRowExpanded={
                expandable ? (row) => <ExpandedRow row={row} /> : undefined
              }
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
