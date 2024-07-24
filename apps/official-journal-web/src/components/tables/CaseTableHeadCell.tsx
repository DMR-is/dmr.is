import cn from 'classnames'

import { Box, Icon, Table as T, Text } from '@island.is/island-ui/core'

import * as styles from './CaseTable.css'

type Props = {
  children?: React.ReactNode | string
  sortable?: boolean
  onClick?: () => void
  className?: string
  fixed?: boolean
  size?: 'tiny' | 'small' | 'default'
}

export const TableHeadCell = ({
  children,
  sortable,
  className,
  onClick,
  size,
  fixed = false,
}: Props) => {
  const Wrapper = onClick ? 'button' : 'div'

  const fixedStyles: React.CSSProperties = {
    position: 'sticky',
    left: 0,
  }

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

  const tableStyles = {
    ...(fixed && fixedStyles),
    ...(size === 'tiny' && tinyTableCellStyles),
    ...(size === 'small' && smallTableCellStyles),
  }

  return (
    <T.HeadData
      style={tableStyles}
      box={{
        paddingLeft: [1, 2, 3],
        paddingRight: [1, 2, 3],
        paddingTop: [1, 2],
        paddingBottom: [1, 2],
      }}
    >
      <Wrapper
        onClick={onClick}
        className={cn(styles.tableHeadCell, className, {})}
      >
        {fixed && (
          <Box
            paddingX={[1, 2, 3]}
            paddingY={[1, 2]}
            className={styles.fixedCellWrapper}
          />
        )}
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
