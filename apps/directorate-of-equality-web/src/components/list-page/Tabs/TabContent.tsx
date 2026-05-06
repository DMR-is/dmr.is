'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table/Table'

import { Paging } from '../../../gen/fetch'
import { type Case, DETAIL_FIELDS } from '../constants'
import * as styles from './TabContent.css'

import { type ColumnDef } from '@tanstack/react-table'

const ExpandedRow = ({ row }: { row: Case }) => (
  <Box background="blue100" padding={2}>
    <div className={styles.expandedRowGrid}>
      {DETAIL_FIELDS.map(({ label, key }, index) => (
        <Box
          key={key}
          background={Math.floor(index / 2) % 2 === 0 ? 'white' : 'blue100'}
          paddingX={1}
          paddingY={1}
          className={styles.expandedRowItem}
        >
          <Box display="flex">
            <div className={styles.expandedRowLabel}>
              <Text variant="small" fontWeight="semiBold">
                {label}
              </Text>
            </div>
            <Text variant="small">{String(row[key])}</Text>
          </Box>
        </Box>
      ))}
    </div>
  </Box>
)

export type TabContentProps = {
  data?: Case[]
  isLoading: boolean
  columns: ColumnDef<Case>[]
  expandable?: boolean
  paging?: Paging
  onPageChange: (page: number) => void
}

export const TabContent = ({
  data = [],
  isLoading,
  columns,
  expandable,
  paging,
  onPageChange,
}: TabContentProps) => {
  return (
    <Box marginTop={3}>
      <Table
        columns={columns}
        data={data}
        loading={isLoading}
        getRowHref={(row) => `/mal/${row.id}`}
        getRowExpanded={
          expandable ? (row) => <ExpandedRow row={row} /> : undefined
        }
        paging={paging}
        onPageChange={onPageChange}
        showPageSizeSelect={false}
      />
    </Box>
  )
}
