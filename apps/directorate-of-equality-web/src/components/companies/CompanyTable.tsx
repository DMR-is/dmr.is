'use client'

import { useMemo } from 'react'

import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table, TableCell } from '@dmr.is/ui/components/Tables/Table'

import {
  type CompanyDto,
  type ReportListItemDto,
} from '../../gen/fetch/types.gen'
import { formatNationalId } from '../../lib/utils'
import { CompanyExpandedRow } from './CompanyExpandedRow'
import {
  deriveStatus,
  normalizeId,
  PAGE_SIZE,
  STATUS_LABEL,
  STATUS_TAG_VARIANT,
} from './companyStatus'

import { type ColumnDef } from '@tanstack/react-table'

type Props = {
  rows: CompanyDto[]
  approvedReports: ReportListItemDto[]
  page: number
  onPageChange: (page: number) => void
}

export const CompanyTable = ({
  rows,
  approvedReports,
  page,
  onPageChange,
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
        accessorKey: 'averageEmployeeCountFromRsk',
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

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageData = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Stack space={2}>
      <Inline space={1} alignY="center">
        <Text fontWeight="semiBold">{rows.length}</Text>
        <Text>fyrirtæki fundust</Text>
      </Inline>
      <Table
        columns={columns}
        data={pageData}
        paging={{
          page,
          pageSize: PAGE_SIZE,
          totalItems: rows.length,
          totalPages,
        }}
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
