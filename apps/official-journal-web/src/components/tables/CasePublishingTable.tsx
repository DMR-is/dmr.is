import {
  animate,
  AnimatePresence,
  motion,
  MotionValue,
  Reorder,
  useDragControls,
  useMotionValue,
} from 'framer-motion'
import { RefObject, useEffect, useRef, useState } from 'react'

import {
  Icon,
  SkeletonLoader,
  Table as T,
  Text,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
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
  onReorder: () => void
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
      key={row.id}
      value={row}
      dragListener={false}
      className={styles.tableRow}
      dragControls={controls}
      dragConstraints={container}
      onPointerUp={() => {
        setIsDragging(false)
        onReorder()
      }}
    >
      <TableCell fixed>
        <Text variant="medium" whiteSpace="nowrap">
          {`${number}/${row.year}`}
        </Text>
      </TableCell>
      <TableCell>
        <Text variant="medium" truncate>
          {row.advert.title}
        </Text>
      </TableCell>
      <TableCell>
        <Text variant="medium" truncate>
          {row.advert.involvedParty.title}
        </Text>
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
  updateRows: React.Dispatch<React.SetStateAction<Case[]>>
  columns: CaseTableHeadCellProps[]
  rows: Case[]
}

export const CasePublishingTable = ({ columns, rows, updateRows }: Props) => {
  const dragContainerRef = useRef<HTMLElement>(null)
  const [reorderableItems, setReorderableItems] = useState<Case[]>(rows)

  // TODO: figure out how we get this number from the DB
  const latestPublicationNumber = 123

  useEffect(() => {
    setReorderableItems(rows)
  }, [rows])

  const reOrder = () => {
    updateRows(reorderableItems)
  }

  return (
    <T.Table box={{ overflow: 'visible' }}>
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
      {reorderableItems.length === 0 ? (
        <CaseTableEmpty columns={columns.length} />
      ) : (
        <Reorder.Group
          as="tbody"
          axis="y"
          values={rows}
          onReorder={setReorderableItems}
          ref={dragContainerRef}
        >
          {reorderableItems.map((row, i) => (
            <CasePublishingTableRow
              key={row.id}
              row={row}
              container={dragContainerRef}
              number={latestPublicationNumber + (i + 1)}
              onReorder={reOrder}
            />
          ))}
        </Reorder.Group>
      )}
    </T.Table>
  )
}
