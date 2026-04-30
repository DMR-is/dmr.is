'use client'

import { useState } from 'react'
import AnimateHeight from 'react-animate-height'

import { Box } from '../../../island-is/lib/Box'
import { Icon } from '../../../island-is/lib/Icon'
import { Inline } from '../../../island-is/lib/Inline'
import { SkeletonLoader } from '../../../island-is/lib/SkeletonLoader'
import { Stack } from '../../../island-is/lib/Stack'
import { Table as T } from '../../../island-is/lib/Table'
import { Text } from '../../../island-is/lib/Text'
import { DataTablePagination } from '../DataTable/DataTablePagination'
import type { DataTablePagingProps } from '../DataTable/types'
import * as styles from './Table.css'

import {
  type ColumnDef,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'

export type TableProps<TData extends object> = {
  columns: ColumnDef<TData>[]
  data: TData[]
  /** Return content to render inside the expanded row. Return null to make a row non-expandable. */
  getRowExpanded?: (row: TData) => React.ReactNode
  paging?: DataTablePagingProps
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showPageSizeSelect?: boolean
  loading?: boolean
  noDataMessage?: string
  layout?: 'fixed' | 'auto'
}

export const Table = <TData extends object>({
  columns,
  data,
  getRowExpanded,
  paging,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelect = true,
  loading = false,
  noDataMessage = 'Engar niðurstöður fundust',
  layout = 'auto',
}: TableProps<TData>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const hasExpandable = !!getRowExpanded

  const table = useReactTable({
    data,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => hasExpandable,
  })

  if (loading) {
    return (
      <SkeletonLoader
        repeat={5}
        height={44}
        space={1}
        borderRadius="standard"
      />
    )
  }

  const colSpan = columns.length + (hasExpandable ? 1 : 0)

  return (
    <Stack space={3}>
      <T.Table style={{ tableLayout: layout, width: '100%' }}>
        <T.Head>
          {table.getHeaderGroups().map((headerGroup) => (
            <T.Row key={headerGroup.id}>
              {hasExpandable && (
                <T.HeadData style={{ width: 48, padding: 0 }} />
              )}
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                return (
                  <T.HeadData
                    key={header.id}
                    box={{
                      paddingLeft: [1, 2],
                      paddingRight: [1, 2],
                      paddingTop: [1, 2],
                      paddingBottom: [1, 2],
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={styles.headerButton}
                        style={{ cursor: canSort ? 'pointer' : 'default' }}
                        onClick={
                          canSort
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        <Inline space={1} alignY="center" flexWrap="nowrap">
                          <Text
                            variant="medium"
                            fontWeight="semiBold"
                            color="black"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </Text>
                          {canSort && (
                            <Box
                              className={styles.sortIcon({
                                order: sorted || undefined,
                              })}
                            >
                              <Icon
                                color="blue400"
                                size="small"
                                icon="caretDown"
                                type="filled"
                              />
                            </Box>
                          )}
                        </Inline>
                      </button>
                    )}
                  </T.HeadData>
                )
              })}
            </T.Row>
          ))}
        </T.Head>
        <T.Body>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className={styles.emptyCell}>
                <Text color="dark400">{noDataMessage}</Text>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => {
              const isExpanded = row.getIsExpanded()
              const expandedContent = getRowExpanded?.(row.original)

              return (
                <>
                  <tr
                    key={row.id}
                    className={styles.tableRow({
                      expandable: hasExpandable,
                      expanded: isExpanded,
                    })}
                    onClick={
                      hasExpandable ? () => row.toggleExpanded() : undefined
                    }
                  >
                    {hasExpandable && (
                      <T.Data align="center">
                        <button
                          type="button"
                          className={styles.expandButton}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Loka' : 'Opna'}
                          onClick={(e) => {
                            e.stopPropagation()
                            row.toggleExpanded()
                          }}
                        >
                          <Icon
                            color="blue400"
                            size="small"
                            icon={isExpanded ? 'remove' : 'add'}
                          />
                        </button>
                      </T.Data>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <T.Data
                        key={cell.id}
                        box={{
                          paddingLeft: [1, 2],
                          paddingRight: [1, 2],
                          paddingTop: [1, 2],
                          paddingBottom: [1, 2],
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </T.Data>
                    ))}
                  </tr>
                  {hasExpandable && (
                    <tr
                      key={`${row.id}-expanded`}
                      className={styles.expandedContentRow({
                        expanded: isExpanded,
                      })}
                    >
                      <td colSpan={colSpan} style={{ padding: 0 }}>
                        <AnimateHeight
                          duration={300}
                          height={isExpanded ? 'auto' : 0}
                        >
                          {expandedContent}
                        </AnimateHeight>
                      </td>
                    </tr>
                  )}
                </>
              )
            })
          )}
        </T.Body>
      </T.Table>
      {paging && (
        <DataTablePagination
          paging={paging}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          showPageSizeSelect={showPageSizeSelect}
        />
      )}
    </Stack>
  )
}
