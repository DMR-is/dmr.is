import { Table as T, Text } from '@island.is/island-ui/core'

export type DataTableHeadCellProps = {
  fluid?: boolean
  align?: 'left' | 'right' | 'center'
  children?: React.ReactNode
}

export const DataTableHeadCell = ({
  fluid = false,
  align = 'left',
  children,
}: DataTableHeadCellProps) => {
  const styles = fluid
    ? { width: '100%', whiteSpace: 'nowrap' }
    : { width: 'auto', whiteSpace: 'nowrap' }

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
      <div>
        {typeof children === 'string' ? (
          <Text variant="medium" fontWeight="semiBold">
            {children}
          </Text>
        ) : (
          children
        )}
      </div>
    </T.HeadData>
  )
}
