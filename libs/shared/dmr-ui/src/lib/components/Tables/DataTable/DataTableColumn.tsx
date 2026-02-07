import { DEFAULT_SORT_DIRECTION, SortDirection } from '../../../hooks/constants'
import { useFilters } from '../../../hooks/useFilters'
import { Box } from '../../../island-is/lib/Box'
import { Icon } from '../../../island-is/lib/Icon'
import { Inline } from '../../../island-is/lib/Inline'
import { Table as T } from '../../../island-is/lib/Table'
import { Text } from '../../../island-is/lib/Text'
import * as styles from './DataTable.css'
import { DataTableColumnProps } from './types'

export const DataTableColumn = ({
  field,
  fluid = false,
  width,
  align = 'left',
  children,
  size,
  sortable = false,
  background,
  onSort,
}: DataTableColumnProps) => {
  const { params, setParams } = useFilters()
  const handleSort = (field: string) => {
    const isSameField = params.sortBy === field

    if (isSameField) {
      return setParams({
        direction:
          params.direction === SortDirection.ASC
            ? SortDirection.DESC
            : SortDirection.ASC,
      })
    }

    setParams({
      sortBy: field,
      direction: DEFAULT_SORT_DIRECTION,
    })
  }

  const Wrapper = sortable ? 'button' : 'div'

  const order = params.sortBy === field ? params.direction : undefined

  const tinyTableCellStyles: React.CSSProperties = {
    minWidth: 0,
    maxWidth: 'none',
    whiteSpace: 'nowrap',
    width: 0,
  }

  const smallTableCellStyles: React.CSSProperties = {
    minWidth: 0,
    maxWidth: 'none',
    whiteSpace: 'nowrap',
    width: '130px',
  }

  const inlineStyles = {
    minWidth: width ? width : '100px',
    width: width ? width : 'auto',
    background: background ? background : undefined,

    ...(size === 'tiny' && tinyTableCellStyles),
    ...(size === 'small' && smallTableCellStyles),
  }

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
      <Wrapper
        onClick={() => {
          if (!sortable) return
          onSort ? onSort(field) : handleSort(field)
        }}
      >
        <Inline align={align} space={1} flexWrap="nowrap" alignY="center">
          {typeof children === 'string' ? (
            <Text variant="medium" fontWeight="semiBold">
              {children}
            </Text>
          ) : (
            children
          )}
          {sortable && (
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
