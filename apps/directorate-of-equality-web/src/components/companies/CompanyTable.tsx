'use client'

import { useMemo } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table, TableCell } from '@dmr.is/ui/components/Tables/Table'

import {
  type CompanyDto,
  type Paging,
  type ReportListItemDto,
} from '../../gen/fetch/types.gen'
import { NAV_PATHS } from '../../lib/constants'
import { companiesText, sharedText } from '../../lib/text'
import { COMPANY_SIZE_LABEL, formatNationalId } from '../../lib/utils'
import { CompanyExpandedRow } from './CompanyExpandedRow'
import {
  deriveStatus,
  normalizeId,
  STATUS_LABEL,
  STATUS_TAG_VARIANT,
} from './companyStatus'

import { type ColumnDef, type SortingState } from '@tanstack/react-table'

type Props = {
  rows: CompanyDto[]
  approvedReports: ReportListItemDto[]
  paging: Paging
  onPageChange: (page: number) => void
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
}

export const CompanyTable = ({
  rows,
  approvedReports,
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
        id: 'status',
        header: sharedText.statusLabel,
        enableSorting: false,
        cell: ({ row }) => {
          const status = deriveStatus(row.original, approvedReports)
          return (
            <TableCell
              items={{
                type: 'tag',
                variant: STATUS_TAG_VARIANT[status],
                children: STATUS_LABEL[status],
              }}
            />
          )
        },
      },
    ],
    [approvedReports],
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
          getRowExpanded={(company) => (
            <CompanyExpandedRow
              company={company}
              approvedReports={approvedReports.filter(
                (r) =>
                  normalizeId(r.companyNationalId) ===
                  normalizeId(company.nationalId),
              )}
            />
          )}
        />
      </Stack>
    </Box>
  )
}
