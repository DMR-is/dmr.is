import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from 'nuqs'
import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Pagination } from '@dmr.is/ui/components/island-is/Pagination'
import { Table as T } from '@dmr.is/ui/components/island-is/Table'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { useBreakpoints } from '@dmr.is/ui/hooks/useBreakpoints'

import { LoadingDots } from '@island.is/island-ui/core/LoadingDots/LoadingDots'

import { Advert, Case, Paging } from '../../gen/fetch'
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
  case: Case | Advert
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
  rows: maybeRows,
  defaultSort,
  paging,
}: Props) => {
  const rows = maybeRows ?? []

  const { formatMessage } = useFormatMessage()

  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const breakpoints = useBreakpoints()

  const [_sortKey, setSortKey] = useQueryState(
    'sortBy',
    parseAsString.withDefault(defaultSort.key),
  )
  const [sortDirection, setSortDirection] = useQueryState(
    'direction',
    parseAsString.withDefault(defaultSort.direction),
  )

  const [_, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(paging?.page || 1),
  )

  const onSortClick = (key: string) => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    setSortKey(key)
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
                name={column.name}
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
        {rows.length === 0 ? (
          <CaseTableEmpty columns={columns.length} />
        ) : (
          <T.Body>
            {rows.map((row) => (
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
