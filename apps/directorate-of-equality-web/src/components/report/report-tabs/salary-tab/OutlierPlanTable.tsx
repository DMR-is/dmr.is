'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import { type ReportEmployeeOutlierDto } from '../../../../gen/fetch'

import { type ColumnDef } from '@tanstack/react-table'

const PAGE_SIZE = 10

interface OutlierPlanTableProps {
  outliers: ReportEmployeeOutlierDto[]
}

const columns: ColumnDef<ReportEmployeeOutlierDto>[] = [
  {
    accessorKey: 'reportEmployeeId',
    header: 'Nafn',
  },
  {
    id: 'starf',
    header: 'Starf',
    cell: () => 'TODO',
  },
  {
    id: 'kyn',
    header: 'Kyn',
    cell: () => 'TODO',
  },
  {
    id: 'launafravik',
    header: 'Launafrávik',
    cell: () => 'TODO',
  },
]

const dash = '–'

const ExpandedRow = ({ row }: { row: ReportEmployeeOutlierDto }) => (
  <Box background="blue100" padding={2}>
    <Box display="flex" flexWrap="wrap" style={{ columnGap: 16 }}>
      {[
        { label: 'Ástæða', value: row.reason },
        { label: 'Aðgerð', value: row.action },
        { label: 'Nafn undirritanda', value: row.signatureName },
        { label: 'Hlutverk undirritanda', value: row.signatureRole },
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
  const start = (page - 1) * PAGE_SIZE
  const pageData = outliers.slice(start, start + PAGE_SIZE)

  return (
    <>
      <Text variant="h4" marginBottom={4}>
        Úrbótaáætlun
      </Text>
      <Table
        columns={columns}
        data={pageData}
        getRowExpanded={(row) => <ExpandedRow row={row} />}
        paging={outliers.length > PAGE_SIZE ? {
          page,
          pageSize: PAGE_SIZE,
          totalItems: outliers.length,
          totalPages: Math.ceil(outliers.length / PAGE_SIZE),
        } : undefined}
        onPageChange={setPage}
        showPageSizeSelect={false}
      />
    </>
  )
}
