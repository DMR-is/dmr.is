import { Reorder, useDragControls } from 'framer-motion'
import { RefObject, useEffect, useRef, useState } from 'react'

import {
  AlertMessage,
  Icon,
  SkeletonLoader,
  Table as T,
  Text,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import {
  useCases,
  useDepartments,
  useNextPublicationNumber,
} from '../../hooks/api'
import { usePublishContext } from '../../hooks/usePublishContext'
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

  const [department] = useState('department')
  const { publishingState, setCasesWithPublicationNumber } = usePublishContext()
  const { selectedCaseIds } = publishingState

  const {
    data: caseData,
    error,
    isLoading,
  } = useCases({
    options: {
      refreshInterval: 0,
    },
    params: {
      department: department ? [department] : undefined,
      pageSize: 100,
    },
  })
  const [selectedCases, setSelectedCases] = useState<Case[]>([])

  const { departments } = useDepartments({
    options: {
      refreshInterval: 0,
    },
  })

  const currentDepartment = departments?.find((d) => d.slug === department)

  const { data: nextPublicationNumber } = useNextPublicationNumber({
    options: {
      refreshInterval: 0,
    },
    params: {
      departmentId: currentDepartment?.id,
    },
  })

  const startingNumber = nextPublicationNumber?.publicationNumber
    ? nextPublicationNumber.publicationNumber
    : 1

  useEffect(() => {
    if (caseData) {
      const selectedCases = caseData.cases.filter((c) =>
        selectedCaseIds.includes(c.id),
      )

      const ordered = selectedCases.length
        ? (selectedCaseIds.map((id) =>
            selectedCases.find((c) => c.id === id),
          ) as Case[])
        : []

      const casesWithPublicationNumber = ordered
        ? ordered.map((c, i) => ({
            id: c.id,
            publishingNumber: startingNumber + i,
          }))
        : []
      setCasesWithPublicationNumber(casesWithPublicationNumber)
      setSelectedCases(ordered)
    }
  }, [selectedCaseIds, caseData])

  if (isLoading) return <SkeletonLoader repeat={3} height={44} />

  if (error)
    return (
      <AlertMessage
        type="error"
        title="Villa kom upp!"
        message="Villa kom upp við að sækja mál"
      />
    )

  if (!caseData) {
    return (
      <AlertMessage
        type="error"
        title="Engin mál fundust"
        message="Engin mál fundust með þessum skilyrðum"
      />
    )
  }

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
