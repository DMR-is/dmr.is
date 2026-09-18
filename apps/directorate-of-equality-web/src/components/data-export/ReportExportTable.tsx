'use client'

import { useMemo } from 'react'

import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table, TableCell } from '@dmr.is/ui/components/Tables/Table'

import type { Paging, ReportListItemDto } from '../../gen/fetch/types.gen'
import {
  formatDateIS,
  NAV_PATHS,
  ReportStatusTranslatedEnum,
} from '../../lib/constants'
import { dataExportText, sharedText } from '../../lib/text'
import { formatNationalId } from '../../lib/utils'

import type { ColumnDef } from '@tanstack/react-table'

/**
 * Preview of the Skýrslur export.
 *
 * Six columns, against the export file's thirty-eight. The table is here to
 * confirm the filter caught the right reports before the file is downloaded,
 * not to be the file — putting every exported column on screen would make the
 * one job it has harder.
 *
 * Rows link through to the report, so an admin who spots something odd in the
 * preview can go and look at it rather than exporting and cross-referencing.
 */
const STATUS_VARIANT: Record<string, 'blue' | 'mint' | 'red' | 'purple'> = {
  SUBMITTED: 'blue',
  IN_REVIEW: 'purple',
  POSTPONED: 'purple',
  APPROVED: 'mint',
  DENIED: 'red',
  SUPERSEDED: 'red',
  WITHDRAWN: 'red',
}

type Props = {
  rows: ReportListItemDto[]
  paging: Paging
  onPageChange: (page: number) => void
}

export const ReportExportTable = ({ rows, paging, onPageChange }: Props) => {
  const columns = useMemo<ColumnDef<ReportListItemDto>[]>(
    () => [
      {
        accessorKey: 'identifier',
        header: dataExportText.columnIdentifier,
        meta: { fit: true },
        cell: ({ row }) => (
          <Text variant="small">{row.original.identifier ?? '—'}</Text>
        ),
      },
      {
        accessorKey: 'type',
        header: dataExportText.columnType,
        meta: { fit: true },
        cell: ({ row }) => (
          <Text variant="small">
            {sharedText.typeLabels[row.original.type] ?? row.original.type}
          </Text>
        ),
      },
      {
        accessorKey: 'companyName',
        header: dataExportText.columnCompany,
        meta: { grow: true },
        cell: ({ row }) => (
          <>
            <Text variant="small">{row.original.companyName ?? '—'}</Text>
            {row.original.companyNationalId && (
              <Text variant="small" color="dark300">
                {formatNationalId(row.original.companyNationalId)}
              </Text>
            )}
          </>
        ),
      },
      {
        accessorKey: 'status',
        header: dataExportText.columnStatus,
        meta: { fit: true },
        cell: ({ row }) => (
          <TableCell
            items={[
              {
                type: 'tag',
                variant: STATUS_VARIANT[row.original.status] ?? 'blue',
                children:
                  ReportStatusTranslatedEnum[
                    row.original
                      .status as keyof typeof ReportStatusTranslatedEnum
                  ] ?? row.original.status,
                light: true,
              },
            ]}
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: dataExportText.columnCreated,
        meta: { fit: true },
        cell: ({ row }) => (
          <Text variant="small">
            {row.original.createdAt
              ? formatDateIS(String(row.original.createdAt))
              : '—'}
          </Text>
        ),
      },
      {
        accessorKey: 'validUntil',
        header: dataExportText.columnValidUntil,
        meta: { fit: true },
        cell: ({ row }) => (
          <Text variant="small">
            {row.original.validUntil
              ? formatDateIS(String(row.original.validUntil))
              : '—'}
          </Text>
        ),
      },
    ],
    [],
  )

  return (
    <Table
      columns={columns}
      data={rows}
      layout="auto"
      paging={paging}
      onPageChange={onPageChange}
      showPageSizeSelect={false}
      getRowHref={(row) => `${NAV_PATHS.heildarlisti.href}/${row.id}`}
    />
  )
}
