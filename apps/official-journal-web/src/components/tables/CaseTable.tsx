import {
  ArrowLink,
  Box,
  Icon,
  LinkV2,
  SkeletonLoader,
  Table as T,
} from '@island.is/island-ui/core'
import orderBy from 'lodash/orderBy'
import reverse from 'lodash/reverse'

import { messages } from '../../lib/messages'
import { TableHeadCell } from './CaseTableHeadCell'

import * as styles from './CaseTable.css'

import { useEffect, useMemo, useState } from 'react'
import useBreakpoints from '../../hooks/useBreakpoints'
import { useFilterContext } from '../../hooks/useFilterContext'
import { TableCell } from './CaseTableCell'

export type CaseTableHeadCellProps = {
  children?: React.ReactNode
  name: string
  sortable?: boolean
  small?: boolean
}

export type CaseTableCellProps = {
  sortingKey?: string
  sortingValue?: string
  children?: React.ReactNode
}

export type CaseTableRowProps = {
  caseId: string
  cells: CaseTableCellProps[]
}

export type Props = {
  defaultSort?: CaseTableColumnSort
  columns: CaseTableHeadCellProps[]
  rows: CaseTableRowProps[]
}

export type CaseTableColumnSort = {
  key: string
  direction: 'asc' | 'desc'
}

export const CaseTable = ({
  columns,
  rows,
  defaultSort = {
    direction: 'asc',
    key: columns.find((column) => column.sortable)?.name || '',
  },
}: Props) => {
  const [mounted, setMounted] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const breakpoints = useBreakpoints()

  const [sorting, setSorting] = useState<{
    key: string
    direction: 'asc' | 'desc'
  }>({
    ...defaultSort,
  })

  const { searchFilter } = useFilterContext()

  const filteredData = useMemo(() => {
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
  }, [searchFilter, sorting])

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
    <T.Table>
      <T.Head>
        <T.Row>
          {columns.map((column, index) => (
            <TableHeadCell
              key={index}
              small={column.small}
              sortable={column.sortable}
              onClick={
                column.sortable ? () => onSortClick(column.name) : undefined
              }
            >
              {column.children}
            </TableHeadCell>
          ))}
        </T.Row>
      </T.Head>
      <T.Body>
        {filteredData.map((row, index) => (
          <tr
            className={styles.tableRow}
            onMouseOver={() => setHoveredRow(row.caseId)}
            key={index}
          >
            {row.cells.map((cell) => (
              <TableCell>{cell.children}</TableCell>
            ))}
            <td align="center" className={styles.linkTableCell}>
              <Box
                className={styles.seeMoreTableCellLink({
                  visible: hoveredRow === row.caseId,
                })}
              >
                {!breakpoints.xl ? (
                  <LinkV2 href={`/ritstjorn/${row.caseId}`}>
                    <Icon icon="arrowForward" color="blue400" />
                  </LinkV2>
                ) : (
                  <ArrowLink href={`/ritstjorn/${row.caseId}`}>
                    {messages.general.see_more}
                  </ArrowLink>
                )}
              </Box>
            </td>
          </tr>
        ))}
      </T.Body>
    </T.Table>
  )
}
