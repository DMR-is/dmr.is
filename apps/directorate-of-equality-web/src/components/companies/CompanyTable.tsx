'use client'

import { useMemo } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Tooltip } from '@dmr.is/ui/components/island-is/Tooltip'
import { Table, TableCell } from '@dmr.is/ui/components/Tables/Table'
import { type TableCellItem } from '@dmr.is/ui/components/Tables/Table'

import {
  type CompanyDto,
  type CompanyObligationStatusEnum,
  CompanyStatusEnum,
  type Paging,
} from '../../gen/fetch/types.gen'
import { NAV_PATHS } from '../../lib/constants'
import { companiesText, overviewText, sharedText } from '../../lib/text'
import { COMPANY_SIZE_LABEL, formatNationalId } from '../../lib/utils'
import { CompanyExpandedRow } from './CompanyExpandedRow'
import {
  OBLIGATION_STATUS_LABEL,
  OBLIGATION_STATUS_TAG_VARIANT,
  SALARY_OBLIGATION_TAG_VARIANT,
} from './companyStatus'

import { type ColumnDef, type SortingState } from '@tanstack/react-table'

/**
 * One obligation's cell: its own state, plus the overdue marker when the
 * deadline for THIS obligation has passed.
 *
 * The overdue flag is gated server-side on the obligation
 * (`equalityReportOverdueSql` / `salaryReportOverdueSql`), so it cannot appear
 * beside "Á ekki við" — a company that owes nothing has no deadline to miss,
 * whatever date the register seeded onto it.
 */
const ObligationCell = ({
  status,
  overdue,
  variants,
}: {
  status: CompanyObligationStatusEnum
  overdue: boolean
  variants: typeof OBLIGATION_STATUS_TAG_VARIANT
}) => {
  const variant = variants[status]
  const label = OBLIGATION_STATUS_LABEL[status]

  // NOT_REQUIRED has no tag variant on purpose: muted text, not a badge.
  if (!variant) {
    return (
      <Text variant="small" color="dark300">
        {label}
      </Text>
    )
  }

  const items: TableCellItem[] = [
    { type: 'tag', variant, children: label, light: true },
  ]

  if (overdue) {
    items.push({
      type: 'tag',
      variant: 'red',
      children: companiesText.overdueTag,
      light: true,
    })
  }

  return <TableCell items={items} />
}

/**
 * The flag icons, at most one per axis.
 *
 * ⚠️ TWO independent axes, not three states in one slot:
 *
 *   register — INACTIVE, or nothing. This used to be a tag in the status
 *     column; it moved here when that column split in two. The icon is always
 *     rendered when it applies (only its label needs hover), which is what
 *     keeps the register-status filter from returning a page of rows that look
 *     identical.
 *
 *   activity — var, else dagsektir, else nothing. ⚠️ The precedence is domain
 *     logic and must not be "fixed" into two icons: var is an admin halt on all
 *     activity for the company, so the daily-fines process is stopped or never
 *     started while it is on. Showing only the var when both flags are set is
 *     the correct answer, not a lost fact.
 */
const CompanyFlagIcons = ({ company }: { company: CompanyDto }) => {
  const { status, quarantined, finesStarted } = company

  const icons: {
    key: string
    icon: 'closeCircle' | 'informationCircle' | 'warning'
    color: 'red600' | 'blue400' | 'yellow600'
    text: string
  }[] = []

  if (status === CompanyStatusEnum.INACTIVE) {
    icons.push({
      key: 'register',
      icon: 'closeCircle',
      color: 'red600',
      text: companiesText.companyInactive,
    })
  }

  if (quarantined) {
    icons.push({
      key: 'activity',
      icon: 'informationCircle',
      color: 'blue400',
      text: overviewText.companyQuarantined,
    })
  } else if (finesStarted) {
    icons.push({
      key: 'activity',
      icon: 'warning',
      color: 'yellow600',
      text: overviewText.companyFinesStarted,
    })
  }

  if (!icons.length) return null

  return (
    <Inline space={1} alignY="center">
      {icons.map(({ key, icon, color, text }) => (
        // `Tooltip` hardcodes informationCircle and takes no `icon` prop, so the
        // trigger is passed as children to get a per-axis icon.
        <Tooltip key={key} text={text} placement="left">
          <span>
            <Icon icon={icon} color={color} size="medium" />
          </span>
        </Tooltip>
      ))}
    </Inline>
  )
}

type Props = {
  rows: CompanyDto[]
  paging: Paging
  onPageChange: (page: number) => void
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
}

export const CompanyTable = ({
  rows,
  paging,
  onPageChange,
  sorting,
  onSortingChange,
}: Props) => {
  const columns = useMemo<ColumnDef<CompanyDto>[]>(
    () => [
      {
        accessorKey: 'name',
        header: sharedText.form.nameLabel,
        enableSorting: true,
      },
      {
        accessorKey: 'nationalId',
        header: sharedText.form.kennitalaLabel,
        enableSorting: false,
        cell: ({ getValue }) => formatNationalId(getValue<string>()),
      },
      {
        id: 'employeeCount',
        accessorFn: (row) => COMPANY_SIZE_LABEL[row.employeeCountCategory],
        header: companiesText.expandedRow.avgEmployees,
        enableSorting: true,
      },
      {
        id: 'equalityObligation',
        header: companiesText.equalityColumn,
        enableSorting: false,
        cell: ({ row }) => (
          <ObligationCell
            status={row.original.equalityObligationStatus}
            overdue={row.original.equalityReportOverdue}
            variants={OBLIGATION_STATUS_TAG_VARIANT}
          />
        ),
      },
      {
        id: 'salaryObligation',
        header: companiesText.salaryColumn,
        enableSorting: false,
        cell: ({ row }) => (
          <ObligationCell
            status={row.original.salaryObligationStatus}
            overdue={row.original.salaryReportOverdue}
            variants={SALARY_OBLIGATION_TAG_VARIANT}
          />
        ),
      },
      {
        id: 'companyFlags',
        header: () => null,
        // Two icons wide. One per axis — see CompanyFlagIcons.
        size: 72,
        enableSorting: false,
        cell: ({ row }) => <CompanyFlagIcons company={row.original} />,
      },
    ],
    [],
  )

  return (
    <Box marginLeft={[0, 0, 0, 2]}>
      <Stack space={2}>
        <Inline space={1} alignY="center">
          <Text fontWeight="semiBold" marginTop={[2, 2, 0]}>
            {paging.totalItems}
          </Text>
          <Text marginTop={[2, 2, 0]}>{companiesText.resultsText}</Text>
        </Inline>

        <Table
          columns={columns}
          data={rows}
          sorting={sorting}
          onSortingChange={onSortingChange}
          paging={paging}
          onPageChange={onPageChange}
          showPageSizeSelect={false}
          noDataMessage={companiesText.noData}
          getRowHref={(row) => `${NAV_PATHS.fyrirtaeki.href}/${row.id}`}
          getRowExpanded={(company) => <CompanyExpandedRow company={company} />}
        />
      </Stack>
    </Box>
  )
}
