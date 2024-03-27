import { Icon, Table as T, Text } from '@island.is/island-ui/core'

import * as styles from './CaseTable.css'
type Props = {
  children?: React.ReactNode | string
  sortable?: boolean
  onClick?: () => void
  className?: string
  small?: boolean
}

import cn from 'classnames'

const smallTableCellStyles = {
  minWidth: 0,
  maxWidth: 'none',
  whiteSpace: 'nowrap',
  width: 0,
}

export const TableHeadCell = ({
  children,
  sortable,
  className,
  onClick,
  small = false,
}: Props) => {
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <T.HeadData style={small ? smallTableCellStyles : undefined}>
      <Wrapper
        onClick={onClick}
        className={cn(styles.tableHeadCell, className)}
      >
        {typeof children === 'string' ? (
          <Text variant="medium" fontWeight="semiBold">
            {children}
          </Text>
        ) : (
          children
        )}
        {sortable && <Icon icon="caretDown" color="blue400" size="small" />}
      </Wrapper>
    </T.HeadData>
  )
}
