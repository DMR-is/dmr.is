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
import { formatHourlyRate, formatPercent } from '../../../../lib/utils'

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
    meta: { fit: true },
  },
  {
    id: 'roleTitle',
    header: o.roleHeader,
    cell: ({ row }) => row.original.roleTitle ?? dash,
    enableSorting: true,
    // The only column whose content varies in length, so it takes the slack the
    // others leave rather than every column sharing the width equally.
    meta: { grow: true },
  },
  {
    id: 'gender',
    header: o.genderHeader,
    accessorFn: (row) => (row.gender ? (genderMap[row.gender] ?? '') : ''),
    cell: ({ row }) =>
      row.original.gender ? (genderMap[row.original.gender] ?? dash) : dash,
    enableSorting: true,
    meta: { fit: true },
  },
  {
    id: 'deviationPercent',
    header: o.deviationHeader,
    accessorFn: (row) => row.deviationPercent ?? 0,
    cell: ({ row }) =>
      formatPercent(row.original.deviationPercent, { signed: true }),
    // ⚠️ NOT sortable, and it cannot be. `report_employee_outlier` has exactly
    // two real columns (`report_employee_id`, `group_id`); this value is
    // injected from `wage_gap_decomposition_snapshot.employees` when the DTO is
    // projected, so there is nothing for SQL to ORDER BY. The list is paged, so
    // sorting the page in memory would look sorted while being wrong across
    // pages — worse than not offering it. Sorting this would mean
    // denormalising the snapshot onto the table.
    enableSorting: false,
    meta: { fit: true },
  },
  {
    // The column that explains the selection. Sorted descending by default is
    // the useful order: the biggest carriers of óskýrt first.
    id: 'contributionShare',
    header: o.contributionShareHeader,
    accessorFn: (row) => row.contributionShare ?? 0,
    cell: ({ row }) => formatPercent(row.original.contributionShare),
    // Same as `deviationPercent` above: snapshot-backed, not a column.
    enableSorting: false,
    meta: { fit: true },
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
        { label: o.salary, value: formatHourlyRate(row.regularHourlyWage) },
        {
          label: o.predictedSalary,
          value: formatHourlyRate(row.expectedHourlyWage),
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

  // ⚠️ Explicit map, NOT `as ReportOutlierSortByEnum`. The cast this replaces
  // silently sent any column id to an endpoint whose zod schema accepts only
  // these four, so marking a snapshot-backed column sortable produced a runtime
  // error that `tsc` could not see. An id missing from this map now sends no
  // sort rather than an invalid one, and adding a sortable column means adding
  // it here — where the enum has to have a member for it.
  const SORTABLE: Record<string, ReportOutlierSortByEnum> = {
    employeeOrdinal: ReportOutlierSortByEnum.EMPLOYEE_ORDINAL,
    gender: ReportOutlierSortByEnum.GENDER,
    roleTitle: ReportOutlierSortByEnum.ROLE_TITLE,
  }
  const sortId = sorting[0]?.id
  const sortBy = sortId ? SORTABLE[sortId] : undefined
  const direction = sortBy
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
      {/*
        `layout="auto"` with the `fit`/`grow` meta above, rather than the default
        `fixed`. Fixed layout gave all six columns (five plus the expander) an
        equal share of 100% width, so `Kyn` — three characters — got as much room
        as `Hlutur af óskýrðu`, whose header then wrapped to two lines and still
        pushed the table past its container. Every table sits in an
        `overflow: auto` wrapper from island-ui, so the surplus showed up as a
        horizontal scrollbar on five short columns of data.
      */}
      <Table
        layout="auto"
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
