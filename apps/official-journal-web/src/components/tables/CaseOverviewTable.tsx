import {
  ArrowLink,
  Box,
  Icon,
  LinkV2,
  SkeletonLoader,
  Table as T,
  Text,
} from '@island.is/island-ui/core'
import sortBy from 'lodash/sortBy'
import reverse from 'lodash/reverse'

import { messages } from '../../lib/messages'
import { TableHeadCell } from './TableHeadCell'

import * as styles from './CaseOverviewTable.css'

import { formatDate } from '../../lib/utils'
import { useEffect, useMemo, useState } from 'react'
import { CaseLabelIcon } from './CaseLabelIcon'
import useBreakpoints from '../../hooks/useBreakpoints'
import { useFilterContext } from '../../hooks/useFilterContext'

type TableRowData = {
  id: string
  publicationDate: string
  registrationDate: string
  department: string
  name: string
  labels: string[]
}

type Props = {
  data: TableRowData[]
}

type DataKey = keyof TableRowData

const TableCell = ({ children }: { children: React.ReactNode }) => {
  return (
    <T.Data
      box={{
        paddingLeft: [2, 3],
        paddingRight: [1, 2],
        paddingTop: [1, 2],
        paddingBottom: [1, 2],
      }}
    >
      {children}
    </T.Data>
  )
}

export const CaseOverviewTable = ({ data }: Props) => {
  const [mounted, setMounted] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const [sorting, setSorting] = useState<{
    key: DataKey
    direction: 'asc' | 'desc'
  }>({
    key: 'publicationDate',
    direction: 'desc',
  })

  const breakpoints = useBreakpoints()

  const { searchFilter } = useFilterContext()

  const filteredData = useMemo(() => {
    const filtered = data.filter((row) => {
      return (
        row.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        row.department.toLowerCase().includes(searchFilter.toLowerCase()) ||
        row.publicationDate
          .toLowerCase()
          .includes(searchFilter.toLowerCase()) ||
        row.registrationDate.toLowerCase().includes(searchFilter.toLowerCase())
      )
    })

    const sorted = sortBy(filtered, sorting.key)

    return sorting.direction === 'asc' ? sorted : reverse(sorted)
  }, [searchFilter, sorting])

  const onSortClick = (key: DataKey) => {
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
          <TableHeadCell small />
          <TableHeadCell
            small
            sortable
            onClick={() => onSortClick('publicationDate')}
          >
            {messages.components.tables.caseOverview.headCells.publicationDate}
          </TableHeadCell>
          <TableHeadCell
            small
            sortable
            onClick={() => onSortClick('registrationDate')}
          >
            {messages.components.tables.caseOverview.headCells.registrationDate}
          </TableHeadCell>
          <TableHeadCell
            small
            sortable
            onClick={() => onSortClick('department')}
          >
            {messages.components.tables.caseOverview.headCells.department}
          </TableHeadCell>
          <TableHeadCell sortable onClick={() => onSortClick('name')}>
            {messages.components.tables.caseOverview.headCells.title}
          </TableHeadCell>
          <T.HeadData />
        </T.Row>
      </T.Head>
      <T.Body>
        {filteredData.map((row) => {
          return (
            <tr
              className={styles.tableRow}
              onMouseOver={() => setHoveredRow(row.id)}
              onMouseLeave={() => setHoveredRow(null)}
              key={row.id}
            >
              <TableCell>
                {row.labels.length > 0 && (
                  <div className={styles.iconWrapper}>
                    {row.labels.map((label, index) => (
                      <CaseLabelIcon label={label} key={index} />
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Text variant="medium">{formatDate(row.publicationDate)}</Text>
              </TableCell>
              <TableCell>
                <Text variant="medium">{formatDate(row.registrationDate)}</Text>
              </TableCell>
              <TableCell>
                <Text truncate variant="medium">
                  {row.department}
                </Text>
              </TableCell>
              <TableCell>
                <div className={styles.nameTableCell}>
                  <Text truncate variant="medium">
                    {row.name}
                  </Text>
                </div>
              </TableCell>
              <td align="center" className={styles.linkTableCell}>
                <Box
                  className={styles.seeMoreTableCellLink({
                    visible: hoveredRow === row.id,
                  })}
                >
                  {!breakpoints.xl ? (
                    <LinkV2 href={`/ritstjorn/${row.id}`}>
                      <Icon icon="arrowForward" color="blue400" />
                    </LinkV2>
                  ) : (
                    <ArrowLink href={`/ritstjorn/${row.id}`}>
                      {messages.general.see_more}
                    </ArrowLink>
                  )}
                </Box>
              </td>
            </tr>
          )
        })}
      </T.Body>
    </T.Table>
  )
}
