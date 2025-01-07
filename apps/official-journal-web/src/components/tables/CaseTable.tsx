import reverse from 'lodash/reverse'
import { parseAsInteger, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'

import {
  Box,
  Icon,
  LinkV2,
  LoadingDots,
  Pagination,
  Table as T,
  Text,
} from '@island.is/island-ui/core'

import { CaseOverview, Paging } from '../../gen/fetch'
import useBreakpoints from '../../hooks/useBreakpoints'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import * as styles from './CaseTable.css'
import { TableCell } from './CaseTableCell'
import { CaseTableEmpty } from './CaseTableEmpty'
import { TableHeadCell } from './CaseTableHeadCell'
import { messages } from './messages'

export type CaseTableHeadCellProps = {
  children?: React.ReactNode
  name: string
  sortable?: boolean
  fixed?: boolean
  size?: 'tiny' | 'small' | 'default'
}

export type CaseTableCellProps = {
  sortingKey?: string
  sortingValue?: string
  children?: React.ReactNode
}

export type CaseTableRowProps = {
  case: CaseOverview
  cells: CaseTableCellProps[]
}

export type Props = {
  defaultSort: CaseTableColumnSort
  columns: CaseTableHeadCellProps[]
  rows?: CaseTableRowProps[]
  paging?: Paging
  renderLink?: boolean
  modalLink?: boolean
  loading?: boolean
}

export type CaseTableColumnSort = {
  key: string
  direction: 'asc' | 'desc'
}

export const CaseTable = ({
  renderLink = true,
  loading = false,
  modalLink,
  columns,
  rows,
  defaultSort,
  paging,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const breakpoints = useBreakpoints()

  const [sorting, setSorting] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({
    ...defaultSort,
  })

  const [_, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(paging?.page || 1),
  )

  const sortedData = useMemo(() => {
    if (!rows) return []
    const sorted = [...rows].sort((a, b) => {
      const nameA = a.cells.find((cell) => cell.sortingKey === sorting.key)
      const nameB = b.cells.find((cell) => cell.sortingKey === sorting.key)

      if (!nameA?.sortingValue || !nameB?.sortingValue) return 0

      if (nameA.sortingValue < nameB.sortingValue) {
        return -1
      }
      if (nameA.sortingValue > nameB.sortingValue) {
        return 1
      }
      return 0
    })

    return sorting.direction === 'asc' ? sorted : reverse(sorted)
  }, [sorting, rows])

  const onSortClick = (key: string) => {
    setSorting({
      key: key,
      direction:
        sorting.key === key
          ? sorting.direction === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc',
    })
  }

  return (
    <>
      <T.Table>
        <T.Head>
          <T.Row>
            {loading && (
              <TableHeadCell size="tiny">
                <LoadingDots large={false} />
              </TableHeadCell>
            )}
            {columns.map((column, index) => (
              <TableHeadCell
                key={index}
                size={column.size}
                sortable={column.sortable}
                fixed={column.fixed}
                onClick={
                  column.sortable ? () => onSortClick(column.name) : undefined
                }
              >
                {column.children}
              </TableHeadCell>
            ))}

            {renderLink && (
              <TableHeadCell
                className={styles.linkTableHeaderCell}
              ></TableHeadCell>
            )}
          </T.Row>
        </T.Head>
        {sortedData.length === 0 ? (
          <CaseTableEmpty columns={columns.length} />
        ) : (
          <T.Body>
            {sortedData.map((row) => (
              <tr
                className={styles.tableRow}
                onMouseOver={() => setHoveredRow(row.case.id)}
                onMouseLeave={() => setHoveredRow(null)}
                key={row.case.id}
              >
                {row.cells.map((cell, cellIndex) => (
                  <TableCell
                    fixed={columns.at(cellIndex)?.fixed}
                    key={cellIndex}
                  >
                    {cell.children}
                  </TableCell>
                ))}
                {renderLink && (
                  <td align="center" className={styles.linkTableCell}>
                    <Box
                      className={styles.seeMoreTableCellLink({
                        visible: hoveredRow === row.case.id,
                      })}
                      component={!modalLink ? LinkV2 : 'button'}
                      href={Routes.ProccessingDetail.replace(
                        ':caseId',
                        row.case.id,
                      )}
                    >
                      <Box className={styles.seeMoreTableCellLinkText}>
                        <Text variant="eyebrow" color={'blue400'}>
                          {breakpoints.xl &&
                            formatMessage(
                              messages.general.openCaseLinkText,
                            )}{' '}
                          <Icon
                            icon="arrowForward"
                            color="blue400"
                            className={styles.seeMoreTableCellLinkIcon}
                          />
                        </Text>
                      </Box>
                    </Box>
                  </td>
                )}
              </tr>
            ))}
          </T.Body>
        )}
      </T.Table>
      {paging && paging.totalPages > 1 && (
        <Box marginTop={3}>
          <Pagination
            page={paging.page}
            itemsPerPage={paging.pageSize}
            totalItems={paging.totalItems}
            totalPages={paging.totalPages}
            renderLink={(page, className, children) => (
              <button className={className} onClick={() => setPage(page)}>
                {children}
              </button>
            )}
          />
        </Box>
      )}
    </>
  )
}

export default CaseTable
