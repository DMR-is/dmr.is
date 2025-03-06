import { Box, Icon, Inline, Table as T, Text } from '@island.is/island-ui/core'
import * as styles from './DataTable.css'
export type DataTableHeadCellProps = {
  field: string
  fluid?: boolean
  align?: 'left' | 'right' | 'center'
  children?: React.ReactNode
  sortBy?: string
  onSort?: (field: string) => void
  direction?: 'asc' | 'desc'
}

export const DataTableHeadCell = ({
  field,
  fluid = false,
  align = 'left',
  children,
  onSort,
  direction = 'asc',
  sortBy,
}: DataTableHeadCellProps) => {
  const inlineStyles = fluid
    ? { width: '100%', whiteSpace: 'nowrap' }
    : { width: 'auto', whiteSpace: 'nowrap' }

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
