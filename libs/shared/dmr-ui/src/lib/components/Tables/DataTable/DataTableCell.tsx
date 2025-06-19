import { Table as T, Text } from '@island.is/island-ui/core'

import { DataTableCellProps } from './types'

export const DataTableCell = ({ children }: DataTableCellProps) => {
  return (
    <T.Data
      box={{
        paddingLeft: [1, 2],
        paddingRight: [1, 2],
        paddingTop: [1, 2],
        paddingBottom: [1, 2],
      }}
    >
      <Text variant="small" whiteSpace="nowrap">
        {children}
      </Text>
    </T.Data>
  )
}
