'use client'

import { useMemo, useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import { type ReportEmployeeOutlierDto } from '../../../../gen/fetch'
import { reportText, sharedText } from '../../../../lib/text'

import { type ColumnDef, type SortingState } from '@tanstack/react-table'

const PAGE_SIZE = 10
const dash = '–'
const t = reportText.salaryTab.outlierTable

const genderMap: Record<string, string> = {
  MALE: sharedText.genders.male,
  FEMALE: sharedText.genders.female,
  NEUTRAL: sharedText.genders.neutral,
}

interface OutlierPlanTableProps {
  outliers: ReportEmployeeOutlierDto[]
}

const columns: ColumnDef<ReportEmployeeOutlierDto>[] = [
  {
    accessorKey: 'reportEmployeeId',
    header: t.numberHeader,
    cell: ({ row }) => `${t.employee} ${row.index + 1}`,
    enableSorting: false,
  },
  {
    id: 'starf',
    header: t.roleHeader,
    accessorFn: (row) => row.roleTitle ?? '',
    cell: ({ row }) => row.original.roleTitle ?? dash,
  },
  {
    id: 'kyn',
    header: t.genderHeader,
    accessorFn: (row) => (row.gender ? (genderMap[row.gender] ?? '') : ''),
    cell: ({ row }) =>
      row.original.gender ? (genderMap[row.original.gender] ?? dash) : dash,
  },
  {
    id: 'launafravik',
    header: t.deviationHeader,
    accessorFn: (row) => row.score ?? 0,
    cell: ({ row }) => row.original.score ?? dash,
  },
]

const ExpandedRow = ({ row }: { row: ReportEmployeeOutlierDto }) => (
  <Box background="blue100" padding={2}>
    <Box display="flex" flexWrap="wrap" style={{ columnGap: 16 }}>
      {[
        { label: t.reasonLabel, value: row.reason },
        { label: t.actionLabel, value: row.action },
        { label: t.signatureNameLabel, value: row.signatureName },
        { label: t.signatureRoleLabel, value: row.signatureRole },
      ].map(({ label, value }, i) => (
        <Box
          key={label}
          background={Math.floor(i / 2) % 2 === 0 ? 'white' : 'blue100'}
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
            <Text variant="small">{value ?? dash}</Text>
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)

export const OutlierPlanTable = ({ outliers }: OutlierPlanTableProps) => {
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])

  const sortedOutliers = useMemo(() => {
    if (sorting.length === 0) return outliers
    const { id, desc } = sorting[0]
    return [...outliers].sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''
      if (id === 'starf') {
        aVal = a.roleTitle ?? ''
        bVal = b.roleTitle ?? ''
      } else if (id === 'kyn') {
        aVal = a.gender ? (genderMap[a.gender] ?? '') : ''
        bVal = b.gender ? (genderMap[b.gender] ?? '') : ''
      } else if (id === 'launafravik') {
        aVal = a.score ?? 0
        bVal = b.score ?? 0
      }
      if (aVal < bVal) return desc ? 1 : -1
      if (aVal > bVal) return desc ? -1 : 1
      return 0
    })
  }, [outliers, sorting])

  const start = (page - 1) * PAGE_SIZE
  const pageData = sortedOutliers.slice(start, start + PAGE_SIZE)

  const handleSortingChange = (next: SortingState) => {
    setSorting(next)
    setPage(1)
  }

  return (
    <>
      <Text variant="h4" marginBottom={4}>
        {t.heading}
      </Text>
      <Table
        columns={columns}
        data={pageData}
        getRowExpanded={(row) => <ExpandedRow row={row} />}
        paging={
          sortedOutliers.length > PAGE_SIZE
            ? {
                page,
                pageSize: PAGE_SIZE,
                totalItems: sortedOutliers.length,
                totalPages: Math.ceil(sortedOutliers.length / PAGE_SIZE),
              }
            : undefined
        }
        onPageChange={setPage}
        showPageSizeSelect={false}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </>
  )
}
