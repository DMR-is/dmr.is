import { useEffect, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import {
  type ReportEmployeeOutlierDto,
  ReportOutlierGroupDto,
  ReportOutlierSortByEnum,
  SortDirectionEnum,
} from '../../../../gen/fetch'
import { reportText as r, sharedText } from '../../../../lib/text'
import { useTRPC } from '../../../../lib/trpc/client/trpc'
import { formatSalary } from '../../../../lib/utils'

import { keepPreviousData } from '@tanstack/react-query'
import { type ColumnDef, type SortingState } from '@tanstack/react-table'

const dash = '–'
const s = r.salaryTab
const o = s.outlierTable
const OUTLIERS_PAGE_SIZE = 10

const genderMap: Record<string, string> = {
  MALE: sharedText.genders.male,
  FEMALE: sharedText.genders.female,
  NEUTRAL: sharedText.genders.neutral,
}

// Per-group table: the group column is dropped (every row shares this group).
const columns: ColumnDef<ReportEmployeeOutlierDto>[] = [
  {
    accessorKey: 'employeeOrdinal',
    header: o.numberHeader,
    cell: ({ getValue }) => getValue<number | null>() ?? dash,
    enableSorting: true,
  },
  {
    id: 'roleTitle',
    header: o.roleHeader,
    cell: ({ row }) => row.original.roleTitle ?? dash,
    enableSorting: true,
  },
  {
    id: 'gender',
    header: o.genderHeader,
    accessorFn: (row) => (row.gender ? (genderMap[row.gender] ?? '') : ''),
    cell: ({ row }) =>
      row.original.gender ? (genderMap[row.original.gender] ?? dash) : dash,
    enableSorting: true,
  },
  {
    id: 'score',
    header: o.deviationHeader,
    accessorFn: (row) => row.score ?? 0,
    cell: ({ row }) =>
      row.original.differencePercent == null
        ? dash
        : `${row.original.differencePercent.toLocaleString('is-IS')}%`,
    enableSorting: true,
  },
]

// Shared label/value rows (was the expanded-row grid). Used for both the
// per-employee expanded detail and the group metadata below the table.
const LabelValueRows = ({
  rows,
}: {
  rows: { label: string; value: string | number | null | undefined }[]
}) => (
  <>
    {rows.map(({ label, value }, index) => (
      <Box
        background={index % 2 === 0 ? 'white' : 'blue100'}
        padding={1}
        key={label}
      >
        <GridRow>
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
  </>
)

// Per-employee detail only — group-level fields now live below the table.
const ExpandedRow = ({ row }: { row: ReportEmployeeOutlierDto }) => (
  <Box padding={2} background="blue100">
    <LabelValueRows
      rows={[
        { label: o.points, value: row.score },
        {
          label: o.salary,
          value:
            row.predictedBaseSalary != null
              ? `${formatSalary(row.predictedBaseSalary)} kr.`
              : null,
        },
      ]}
    />
  </Box>
)

// Group reason/action/signature shown beneath the table (was in ExpandedRow).
const GroupMetadata = ({ group }: { group: ReportOutlierGroupDto }) => (
  <Box marginTop={2}>
    <LabelValueRows
      rows={[
        { label: o.reasonLabel, value: group.reason },
        { label: o.actionLabel, value: group.action },
        { label: o.signatureNameLabel, value: group.signatureName },
        { label: o.signatureRoleLabel, value: group.signatureRole },
      ]}
    />
  </Box>
)

interface OutlierGroupTableProps {
  reportId: string
  group: ReportOutlierGroupDto
}

export const OutlierGroupTable = ({
  reportId,
  group,
}: OutlierGroupTableProps) => {
  const trpc = useTRPC()
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])

  useEffect(() => {
    setPage(1)
  }, [reportId, group.id])

  const sortBy = sorting[0]?.id as ReportOutlierSortByEnum | undefined
  const direction = sorting[0]
    ? sorting[0].desc
      ? SortDirectionEnum.DESC
      : SortDirectionEnum.ASC
    : undefined

  const handleSortingChange = (next: SortingState) => {
    setSorting(next)
    setPage(1)
  }

  const { data, isLoading } = useQuery({
    ...trpc.reports.getOutliers.queryOptions({
      id: reportId,
      groupId: group.id,
      page,
      pageSize: OUTLIERS_PAGE_SIZE,
      sortBy,
      direction,
    }),
    placeholderData: keepPreviousData,
  })

  return (
    <Box marginBottom={4}>
      <Text variant="h5" marginBottom={2}>
        {group.name}
      </Text>
      <Table
        columns={columns}
        data={data?.outliers ?? []}
        getRowExpanded={(row) => <ExpandedRow row={row} />}
        paging={data?.paging}
        loading={isLoading}
        onPageChange={setPage}
        showPageSizeSelect={false}
        noDataMessage={s.noDataMessage}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
      <GroupMetadata group={group} />
    </Box>
  )
}
