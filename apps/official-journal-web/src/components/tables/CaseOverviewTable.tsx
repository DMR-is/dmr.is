import {
  ArrowLink,
  Box,
  Icon,
  LinkV2,
  SkeletonLoader,
  Table as T,
  Text,
} from '@island.is/island-ui/core'

import { messages } from '../../lib/messages'
import { TableHeadCell } from './TableHeadCell'

import * as styles from './CaseOverviewTable.css'

import { formatDate } from '../../lib/utils'
import { useEffect, useState } from 'react'
import { CaseLabelIcon } from './CaseLabelIcon'
import useIsMobile from '../../hooks/useIsMobile'

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

  const { isMobile } = useIsMobile()

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
          <TableHeadCell small sortable>
            {messages.components.tables.caseOverview.headCells.publicationDate}
          </TableHeadCell>
          <TableHeadCell small sortable>
            {messages.components.tables.caseOverview.headCells.registrationDate}
          </TableHeadCell>
          <TableHeadCell small sortable>
            {messages.components.tables.caseOverview.headCells.department}
          </TableHeadCell>
          <TableHeadCell sortable>
            {messages.components.tables.caseOverview.headCells.title}
          </TableHeadCell>
          <T.HeadData />
        </T.Row>
      </T.Head>
      <T.Body>
        {data.map((row) => {
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
                  {isMobile ? (
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
