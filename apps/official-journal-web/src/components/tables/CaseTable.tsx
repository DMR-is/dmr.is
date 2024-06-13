import reverse from 'lodash/reverse'
import { useEffect, useMemo, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ReactDOM from 'react-dom'

import {
  Box,
  Icon,
  LinkV2,
  ModalBase,
  Pagination,
  SkeletonLoader,
  Table as T,
  Text,
} from '@island.is/island-ui/core'

import { Case, Paging } from '../../gen/fetch'
import useBreakpoints from '../../hooks/useBreakpoints'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useQueryParams } from '../../hooks/useQueryParams'
import { formatDate, generateCaseLink } from '../../lib/utils'
import { AdvertDisplay } from '../advert-display/AdvertDisplay'
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
  case: Case
  cells: CaseTableCellProps[]
}

export type Props = {
  defaultSort?: CaseTableColumnSort
  columns: CaseTableHeadCellProps[]
  rows: CaseTableRowProps[]
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
  loading = true,
  modalLink,
  columns,
  rows,
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

  const portalRef = useRef<Element>()
  const [modalActive, setModalActive] = useState<Case>()
  useEffect(() => {
    portalRef.current = document.querySelector('#__next') as Element
  })

  const openModal = (e: React.MouseEvent<HTMLElement>, activeCase: Case) => {
    e.preventDefault()
    setModalActive(activeCase)
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
                      onClick={
                        modalLink ? (e) => openModal(e, row.case) : undefined
                      }
                      href={
                        !modalLink
                          ? generateCaseLink(row.case.status, row.case.id)
                          : undefined
                      }
                    >
                      <Text variant="eyebrow" color={'blue400'}>
                        {breakpoints.xl &&
                          formatMessage(messages.general.openCaseLinkText)}{' '}
                        <Icon
                          icon="arrowForward"
                          color="blue400"
                          className={styles.seeMoreTableCellLinkIcon}
                        />
                      </Text>
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
      {modalActive &&
        ReactDOM.createPortal(
          <ModalBase
            baseId="advert"
            isVisible={true}
            initialVisibility={true}
            onVisibilityChange={(isVisible) =>
              !isVisible && setModalActive(undefined)
            }
            hideOnEsc={true}
            modalLabel={formatMessage(messages.modal.modalLabel)}
          >
            <div className={styles.advertModal}>
              <div className={styles.advertModalHeader}>
                <button
                  className={styles.advertModalClose}
                  onClick={() => setModalActive(undefined)}
                >
                  <Icon icon="close" />
                </button>
              </div>
              <AdvertDisplay
                advertNumber={String(modalActive.caseNumber)}
                // TODO: get correct date
                signatureDate={
                  modalActive.requestedPublicationDate
                    ? formatDate(
                        modalActive.requestedPublicationDate,
                        'dd. MMMM yyyy',
                      )
                    : undefined
                }
                advertType={modalActive.advertTitle}
                advertSubject="'STRING'" // modalActive.advertDepartment.title
                advertText="'STRING'" // modalActive.document
                isLegacy={false}
                paddingTop={[5, 6, 8]}
              />
            </div>
          </ModalBase>,
          portalRef.current as Element,
        )}
    </>
  )
}
