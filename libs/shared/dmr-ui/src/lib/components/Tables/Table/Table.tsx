'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
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
  columns: providedColumns,
  data,
  getRowExpanded,
  paging,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelect = true,
  loading = false,
  noDataMessage = 'Engar niðurstöður fundust',
  layout = 'fixed',
}: TableProps<TData>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [collapsingRows, setCollapsingRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    setCollapsingRows(new Set())
  }, [data])

  const columns = useMemo<ColumnDef<TData>[]>(() => {
    if (!getRowExpanded) return providedColumns
    return [
      {
        id: 'expander',
        header: () => null,
        cell: () => null,
        enableSorting: false,
      },
      ...providedColumns,
    ]
  }, [providedColumns, getRowExpanded])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => !!getRowExpanded,
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

  return (
    <Stack space={3}>
      <T.Table style={{ tableLayout: layout, width: '100%' }}>
        <T.Head>
          {table.getHeaderGroups().map((headerGroup) => (
            <T.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                if (header.column.id === 'expander') {
                  return (
                    <T.HeadData
                      key={header.id}
                      style={{ width: 48, padding: 0 }}
                    />
                  )
                }
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
              <td colSpan={columns.length} className={styles.emptyCell}>
                <Text color="dark400">{noDataMessage}</Text>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => {
              const isExpanded = row.getIsExpanded()
              const isCollapsing = collapsingRows.has(row.id)
              const isActive = isExpanded || isCollapsing
              const rowBackground = isActive ? 'blue100' : 'white'

              return (
                <Fragment key={row.id}>
                  <tr
                    className={styles.tableRow({
                      expandable: !!getRowExpanded,
                      expanded: isActive,
                    })}
                    onClick={
                      getRowExpanded ? () => row.toggleExpanded() : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell, i) =>
                      i === 0 && getRowExpanded ? (
                        <T.Data
                          key={cell.id}
                          align="center"
                          style={{ width: 48, padding: 0 }}
                          box={{
                            position: 'relative',
                            background: rowBackground,
                          }}
                        >
                          {isActive && <div className={styles.line} />}
                          <button
                            type="button"
                            className={styles.expandButton}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Loka' : 'Opna'}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              if (isExpanded) {
                                setCollapsingRows((prev) =>
                                  new Set(prev).add(row.id),
                                )
                              }
                              row.toggleExpanded()
                            }}
                          >
                            {/* Uses this to avoid the icons flickering when opening/closing */}
                            <span
                              style={{ display: isExpanded ? 'none' : 'flex' }}
                            >
                              <Icon
                                color="blue400"
                                size="small"
                                icon="add"
                                type="filled"
                              />
                            </span>
                            <span
                              style={{ display: isExpanded ? 'flex' : 'none' }}
                            >
                              <Icon
                                color="blue400"
                                size="small"
                                icon="remove"
                                type="filled"
                              />
                            </span>
                          </button>
                        </T.Data>
                      ) : (
                        <T.Data
                          key={cell.id}
                          box={{
                            paddingLeft: [1, 2],
                            paddingRight: [1, 2],
                            paddingTop: [1, 2],
                            paddingBottom: [1, 2],
                            background: rowBackground,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </T.Data>
                      ),
                    )}
                  </tr>
                  {getRowExpanded && (
                    <tr>
                      <T.Data
                        colSpan={columns.length}
                        style={{ padding: 0 }}
                        box={{ position: 'relative' }}
                      >
                        <AnimateHeight
                          duration={300}
                          height={isExpanded ? 'auto' : 0}
                          onHeightAnimationEnd={(newHeight) => {
                            if (newHeight === 0) {
                              setCollapsingRows((prev) => {
                                const next = new Set(prev)
                                next.delete(row.id)
                                return next
                              })
                            }
                          }}
                        >
                          {isActive && (
                            <>
                              <div className={styles.line} />
                              {getRowExpanded(row.original)}
                            </>
                          )}
                        </AnimateHeight>
                      </T.Data>
                    </tr>
                  )}
                </Fragment>
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
