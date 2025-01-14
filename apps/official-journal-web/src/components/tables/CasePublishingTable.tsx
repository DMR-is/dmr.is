import { Reorder, useDragControls } from 'framer-motion'
import { RefObject, useRef, useState } from 'react'

import { Icon, Table as T, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { CaseTableHeadCellProps } from './CaseTable'
import * as styles from './CaseTable.css'
import { TableCell } from './CaseTableCell'
import { CaseTableEmpty } from './CaseTableEmpty'
import { TableHeadCell } from './CaseTableHeadCell'

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
  columns: CaseTableHeadCellProps[]
}

export const CasePublishingTable = ({ columns }: Props) => {
  const dragContainerRef = useRef<HTMLElement>(null)

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
      {selectedCases.length === 0 ? (
        <CaseTableEmpty columns={columns.length} />
      ) : (
        <Reorder.Group
          as="tbody"
          axis="y"
          values={selectedCases}
          onReorder={(newOrder) => {
            setSelectedCases(newOrder)
            setCasesWithPublicationNumber(
              newOrder.map((c, i) => ({
                id: c.id,
                publishingNumber: startingNumber + i,
              })),
            )
          }}
          ref={dragContainerRef}
        >
          {selectedCases.map((row, i) => {
            return (
              <CasePublishingTableRow
                key={row.id}
                row={row}
                container={dragContainerRef}
                number={startingNumber + i}
              />
            )
          })}
        </Reorder.Group>
      )}
    </T.Table>
  )
}
