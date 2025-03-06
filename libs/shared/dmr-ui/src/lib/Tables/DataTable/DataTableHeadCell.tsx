import { Icon, Inline, Table as T, Text } from '@island.is/island-ui/core'

export type DataTableHeadCellProps = {
  field: string
  fluid?: boolean
  align?: 'left' | 'right' | 'center'
  children?: React.ReactNode
  onSort?: (field: string) => void
}

export const DataTableHeadCell = ({
  field,
  fluid = false,
  align = 'left',
  children,
  onSort,
}: DataTableHeadCellProps) => {
  const styles = fluid
    ? { width: '100%', whiteSpace: 'nowrap' }
    : { width: 'auto', whiteSpace: 'nowrap' }

  const Wrapper = onSort ? 'button' : 'div'

  return (
    <T.HeadData
      style={styles}
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
          {onSort && <Icon icon="chevronDown" />}
        </Inline>
      </Wrapper>
    </T.HeadData>
  )
}
