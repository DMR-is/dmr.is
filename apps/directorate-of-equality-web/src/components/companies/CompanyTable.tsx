'use client'

import { useMemo } from 'react'

import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table, TableCell } from '@dmr.is/ui/components/Tables/Table'

import {
  type CompanyDto,
  type Paging,
  type ReportListItemDto,
} from '../../gen/fetch/types.gen'
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
      { accessorKey: 'name', header: 'Nafn', enableSorting: true },
      {
        accessorKey: 'nationalId',
        header: 'Kennitala',
        enableSorting: false,
        cell: ({ getValue }) => formatNationalId(getValue<string>()),
      },
      {
        id: 'employeeCount',
        accessorFn: (row) => COMPANY_SIZE_LABEL[row.employeeCountCategory],
        header: 'Meðalfjöldi starfsmanna',
        enableSorting: true,
      },
      {
        id: 'status',
        header: 'Staða',
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
    <Stack space={2}>
      <Inline space={1} alignY="center">
        <Text fontWeight="semiBold" marginTop={[2, 2, 0]}>
          {paging.totalItems}
        </Text>
        <Text marginTop={[2, 2, 0]}>fyrirtæki fundust</Text>
      </Inline>
      <Table
        columns={columns}
        data={rows}
        sorting={sorting}
        onSortingChange={onSortingChange}
        paging={paging}
        onPageChange={onPageChange}
        showPageSizeSelect={false}
        noDataMessage="Engin fyrirtæki skráð"
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
  )
}
