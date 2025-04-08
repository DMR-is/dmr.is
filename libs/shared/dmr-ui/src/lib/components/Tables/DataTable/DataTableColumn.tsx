import { Box } from '@island.is/island-ui/core/Box/Box'
import { Icon } from '@island.is/island-ui/core/IconRC/Icon'
import { Inline } from '@island.is/island-ui/core/Inline/Inline'
import { Table as T } from '@island.is/island-ui/core/Table'
import { Text } from '@island.is/island-ui/core/Text/Text'

import * as styles from './DataTable.css'
import { DataTableColumnProps } from './types'

export const DataTableColumn = ({
  field,
  fluid = false,
  width,
  align = 'left',
  children,
  onSort,
  direction = 'asc',
  sortBy,
}: DataTableColumnProps) => {
  const inlineStyles = {
    minWidth: width ? width : '100px',
    width: width ? width : 'auto',
  }

  const Wrapper = onSort ? 'button' : 'div'

  const order = sortBy === field ? direction : undefined

  return (
    <T.HeadData
      style={inlineStyles}
      box={{
        paddingLeft: [1, 2],
        paddingRight: [1, 2],
        paddingTop: [1, 2],
        paddingBottom: [1, 2],
        textAlign: align,
      }}
    >
      <Wrapper onClick={() => onSort && onSort(field)}>
        <Inline space={1} flexWrap="nowrap" alignY="center">
          {typeof children === 'string' ? (
            <Text variant="medium" fontWeight="semiBold">
              {children}
            </Text>
          ) : (
            children
          )}
          {onSort && (
            <Box
              className={styles.dataTableHeadCellChevron({
                order: order,
              })}
            >
              <Icon
                color="blue400"
                size="small"
                icon="caretDown"
                type="filled"
              />
            </Box>
          )}
        </Inline>
      </Wrapper>
    </T.HeadData>
  )
}
