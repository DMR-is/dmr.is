import { Table as T, Text, Icon } from '@island.is/island-ui/core'
import * as styles from './CaseOverviewTable.css'
type Props = {
  children?: string
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
        <Text variant="medium" fontWeight="semiBold">
          {children}
        </Text>
        {sortable && <Icon icon="caretDown" color="blue400" size="small" />}
      </Wrapper>
    </T.HeadData>
  )
}
