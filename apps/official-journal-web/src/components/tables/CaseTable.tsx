import reverse from 'lodash/reverse'
import { ReactNode, useEffect, useMemo, useState } from 'react'

import {
  ArrowLink,
  Box,
  Icon,
  LinkV2,
  Pagination,
  SkeletonLoader,
  Table as T,
} from '@island.is/island-ui/core'

import { CaseStatusEnum, Paging } from '../../gen/fetch'
import useBreakpoints from '../../hooks/useBreakpoints'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useQueryParams } from '../../hooks/useQueryParams'
import { caseStatusMap } from '../../lib/utils'
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
  small?: boolean
}

export type CaseTableCellProps = {
  sortingKey?: string
  sortingValue?: string
  children?: React.ReactNode
}

export type CaseTableRowProps = {
  caseId: string
  status: CaseStatusEnum
  cells: CaseTableCellProps[]
}

export type Props = {
  defaultSort?: CaseTableColumnSort
  columns: CaseTableHeadCellProps[]
  rows: CaseTableRowProps[]
  renderLink?: boolean
  paging?: Paging
}

export type CaseTableColumnSort = {
  key: string
  direction: 'asc' | 'desc'
}

export const CaseTable = ({
  columns,
  rows,
  renderLink = true,
  defaultSort = {
    direction: 'asc',
    key: columns.find((column) => column.sortable)?.name || '',
  },
  paging,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const { add } = useQueryParams()

  const [mounted, setMounted] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const breakpoints = useBreakpoints()

  const [sorting, setSorting] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({
    ...defaultSort,
  })

  const sortedData = useMemo(() => {
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

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <SkeletonLoader height={45} repeat={5} />
  }

  return (
    <>
      <T.Table>
        <T.Head>
          <T.Row>
            {columns.map((column, index) => (
              <TableHeadCell
                key={index}
                small={column.small}
                sortable={column.sortable}
                fixed={column.fixed}
                onClick={
                  column.sortable ? () => onSortClick(column.name) : undefined
                }
              >
                {column.children}
              </TableHeadCell>
            ))}
          </T.Row>
        </T.Head>
        {sortedData.length === 0 ? (
          <CaseTableEmpty />
        ) : (
          <T.Body>
            {sortedData.map((row, index) => (
              <tr
                className={styles.tableRow}
                onMouseOver={() => setHoveredRow(row.caseId)}
                onMouseLeave={() => setHoveredRow(null)}
                key={index}
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
                        visible: hoveredRow === row.caseId,
                      })}
                    >
                      {!breakpoints.xl ? (
                        <LinkV2
                          href={`/ritstjorn/${row.caseId}/${
                            caseStatusMap[row.status]
                          }`}
                        >
                          <Icon icon="arrowForward" color="blue400" />
                        </LinkV2>
                      ) : (
                        <ArrowLink
                          href={`/ritstjorn/${row.caseId}/${
                            caseStatusMap[row.status]
                          }`}
                        >
                          {formatMessage(messages.general.openCaseLinkText)}
                        </ArrowLink>
                      )}
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
              <button className={className} onClick={() => add({ page })}>
                {children}
              </button>
            )}
          />
        </Box>
      )}
    </>
  )
}
