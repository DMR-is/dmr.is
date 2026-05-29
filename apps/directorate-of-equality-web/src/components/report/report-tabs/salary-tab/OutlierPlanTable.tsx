import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import {
  type Paging,
  type ReportEmployeeOutlierDto,
} from '../../../../gen/fetch'
import { reportText as r, sharedText } from '../../../../lib/text'
import * as styles from './OutlierPlanTable.css'

import { type ColumnDef } from '@tanstack/react-table'

interface OutlierPlanTableProps {
  outliers: ReportEmployeeOutlierDto[]
  paging?: Paging
  loading?: boolean
  onPageChange?: (page: number) => void
}

const dash = '–'

const s = r.salaryTab
const o = s.outlierTable

const genderMap: Record<string, string> = {
  MALE: sharedText.genders.male,
  FEMALE: sharedText.genders.female,
  NEUTRAL: sharedText.genders.neutral,
}
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
    header: o.genderHeader,
    accessorFn: (row) => (row.gender ? (genderMap[row.gender] ?? '') : ''),
    cell: ({ row }) =>
      row.original.gender ? (genderMap[row.original.gender] ?? dash) : dash,
  },
  {
    id: 'launafravik',
    header: o.deviationHeader,
    accessorFn: (row) => row.score ?? 0,
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
        { label: o.reasonLabel, value: row.reason },
        { label: o.actionLabel, value: row.action },
        { label: o.signatureNameLabel, value: row.signatureName },
        { label: o.signatureRoleLabel, value: row.signatureRole },
      ].map(({ label, value }) => (
        <Box
          key={label}
          paddingX={1}
          paddingY={1}
          className={styles.expandedRowItem}
        >
          <Box display="flex">
            <Box style={{ minWidth: 180 }}>
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
        {o.heading}
      </Text>
      <Table
        columns={columns}
        data={outliers}
        getRowExpanded={(row) => <ExpandedRow row={row} />}
        paging={paging}
        loading={loading}
        onPageChange={onPageChange}
        showPageSizeSelect={false}
        noDataMessage={s.noDataMessage}
      />
    </>
  )
}
