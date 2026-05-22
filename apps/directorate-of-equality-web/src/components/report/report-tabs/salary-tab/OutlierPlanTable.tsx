import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import { type Paging, type ReportEmployeeOutlierDto } from '../../../../gen/fetch'

import { type ColumnDef } from '@tanstack/react-table'

interface OutlierPlanTableProps {
  outliers: ReportEmployeeOutlierDto[]
  paging?: Paging
  loading?: boolean
  onPageChange?: (page: number) => void
}

const dash = '–'

const columns: ColumnDef<ReportEmployeeOutlierDto>[] = [
  {
    accessorKey: 'employeeOrdinal',
    header: 'Númer',
    cell: ({ getValue }) => getValue<number | null>() ?? dash,
  },
  {
    id: 'starf',
    header: 'Starf',
    cell: ({ row }) => row.original.roleTitle ?? dash,
  },
  {
    id: 'kyn',
    header: 'Kyn',
    cell: ({ row }) => row.original.gender ?? dash,
  },
  {
    id: 'launafravik',
    header: 'Launafrávik',
    cell: ({ row }) =>
      row.original.differencePercent == null
        ? dash
        : `${row.original.differencePercent.toLocaleString('is-IS')}%`,
  },
]

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

export const OutlierPlanTable = ({
  outliers,
  paging,
  loading,
  onPageChange,
}: OutlierPlanTableProps) => {
  return (
    <>
      <Text variant="h4" marginBottom={4}>
        Úrbótaáætlun
      </Text>
      <Table
        columns={columns}
        data={outliers}
        getRowExpanded={(row) => <ExpandedRow row={row} />}
        paging={paging}
        loading={loading}
        onPageChange={onPageChange}
        showPageSizeSelect={false}
        noDataMessage="Engin úrbótaáætlun skráð"
      />
    </>
  )
}
