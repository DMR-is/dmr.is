import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import {
  type Paging,
  type ReportEmployeeOutlierDto,
} from '../../../../gen/fetch'
import { reportText as r, reportText, sharedText } from '../../../../lib/text'
import { formatSalary } from '../../../../lib/utils'
import { OutlierInputForm } from './OutlierInputForm'

import { type ColumnDef } from '@tanstack/react-table'

interface OutlierPlanTableProps {
  outliers: ReportEmployeeOutlierDto[]
  paging?: Paging
  loading?: boolean
  onPageChange?: (page: number) => void
  outliersPostponed?: boolean
  outlierDate?: Date
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
    header: o.numberHeader,
    cell: ({ getValue }) => getValue<number | null>() ?? dash,
  },
  {
    id: 'starf',
    header: o.roleHeader,
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
  <Box padding={2} background="blue100">
    {[
      { label: o.points, value: row.score },
      {
        label: o.salary,
        value:
          row.predictedBaseSalary != null
            ? `${formatSalary(row.predictedBaseSalary)} kr.`
            : null,
      },
      { label: o.reasonLabel, value: row.reason },
      { label: o.actionLabel, value: row.action },
      { label: o.signatureNameLabel, value: row.signatureName },
      { label: o.signatureRoleLabel, value: row.signatureRole },
    ].map(({ label, value }, index) => (
      <Box
        background={index % 2 === 0 ? 'white' : 'blue100'}
        padding={1}
        key={label}
      >
        <GridRow key={label}>
          <GridColumn span="4/12">
            <Text variant="small" fontWeight="semiBold">
              {label}
            </Text>
          </GridColumn>

          <GridColumn>
            <Text variant="small" textAlign="left">
              {value ?? dash}
            </Text>
          </GridColumn>
        </GridRow>
      </Box>
    ))}
  </Box>
)

export const OutlierPlanTable = ({
  outliers,
  paging,
  loading,
  onPageChange,
  outliersPostponed,
  outlierDate,
}: OutlierPlanTableProps) => {
  return (
    <>
      <Text variant="h4" marginBottom={4}>
        {o.heading}
      </Text>
      {outliersPostponed && (
        <Box marginBottom={2}>
          <Stack space={2}>
            <AlertMessage
              type="warning"
              title={reportText.salaryTab.outliersPostponedTitle}
              message={reportText.salaryTab.outliersPostponedMessage}
            />

            <OutlierInputForm outlierDate={outlierDate} />
          </Stack>
        </Box>
      )}
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
