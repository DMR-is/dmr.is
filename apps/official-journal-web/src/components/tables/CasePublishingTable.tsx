import { Reorder, useDragControls } from 'framer-motion'
import { RefObject, useRef, useState } from 'react'

import {
  Icon,
  SkeletonLoader,
  Table as T,
  Text,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useNextPublicationNumber } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { TableCell } from './CaseTableCell'
import { CaseTableEmpty } from './CaseTableEmpty'
import { TableHeadCell } from './CaseTableHeadCell'
import { messages } from './messages'

type RowProps = {
  row: Case
  container: RefObject<HTMLElement>
  number: number
  onReorder?: () => void
}

const CasePublishingTableRow = ({
  row,
  container,
  number,
  onReorder,
}: RowProps) => {
  const controls = useDragControls()
  const [isDragging, setIsDragging] = useState<boolean>(false)

  return (
    <Reorder.Item
      as="tr"
      value={row}
      dragListener={false}
      className={styles.tableRow}
      dragControls={controls}
      dragConstraints={container}
      onPointerUp={() => {
        setIsDragging(false)
        onReorder && onReorder()
      }}
    >
      <TableCell fixed>
        <Text variant="medium" whiteSpace="nowrap">
          {`${number}/${new Date().getFullYear()}`}
        </Text>
      </TableCell>
      <TableCell>
        <div className={styles.titleTableCell}>
          <Text variant="medium" truncate>
            {row.advertType.title} {row.advertTitle}
          </Text>
        </div>
      </TableCell>
      <TableCell>
        <div className={styles.typeTableCell}>
          <Text variant="medium" truncate>
            {row.involvedParty.title}
          </Text>
        </div>
      </TableCell>
      <TableCell>
        <button
          onPointerDown={(e) => {
            setIsDragging(true)
            e.preventDefault()
            controls.start(e)
          }}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <Icon icon="menu" color="blue400" />
        </button>
      </TableCell>
    </Reorder.Item>
  )
}

type Props = {
  cases: Case[]
  onReorder?: (cases: Case[]) => void
}

export const CasePublishingTable = ({ cases, onReorder }: Props) => {
  const { formatMessage } = useFormatMessage()
  const dragContainerRef = useRef<HTMLElement>(null)

  const columns: CaseTableHeadCellProps[] = [
    {
      name: 'caseNumber',
      sortable: true,
      fixed: true,
      size: 'small',
      children: formatMessage(messages.tables.selectedCases.columns.number),
    },
    {
      name: 'caseTitle',
      sortable: false,
      fixed: false,
      children: formatMessage(messages.tables.selectedCases.columns.title),
    },
    {
      name: 'caseInstitution',
      sortable: false,
      fixed: false,
      children: formatMessage(
        messages.tables.selectedCases.columns.institution,
      ),
    },
    {
      name: '',
      fixed: false,
      size: 'tiny',
      children: '',
    },
  ]

  return (
    <T.Table>
      <T.Head>
        <T.Row>
          {columns.map((column, index) => (
            <TableHeadCell
              key={index}
              size={column.size}
              sortable={column.sortable}
              fixed={column.fixed}
            >
              {column.children}
            </TableHeadCell>
          ))}
        </T.Row>
      </T.Head>
      {cases.length === 0 ? (
        <CaseTableEmpty
          columns={columns.length}
          message={formatMessage(messages.tables.selectedCases.empty.message)}
        />
      ) : isLoading ? (
        <SkeletonLoader
          repeat={3}
          height={44}
          space={2}
          borderRadius="standard"
        />
      ) : (
        <Reorder.Group
          as="tbody"
          axis="y"
          values={cases}
          onReorder={(newOrder) =>
            onReorder &&
            onReorder(
              newOrder.map((c, i) => {
                const newPublicationNumber = data?.publicationNumber ?? 1 + i

                return {
                  ...c,
                  publicationNumber: newPublicationNumber.toString(),
                }
              }),
            )
          }
          ref={dragContainerRef}
        >
          {cases.map((row, i) => {
            return (
              <CasePublishingTableRow
                key={row.id}
                row={row}
                container={dragContainerRef}
                number={data?.publicationNumber ?? 1 + i}
              />
            )
          })}
        </Reorder.Group>
      )}
    </T.Table>
  )
}
