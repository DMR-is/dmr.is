import cn from 'classnames'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Box, Icon, Table as T, Text } from '@island.is/island-ui/core'

import * as styles from './CaseTable.css'

type Props = {
  children?: React.ReactNode | string
  name?: string
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
  name,
  onClick,
  size,
  fixed = false,
}: Props) => {
  const Wrapper = onClick ? 'button' : 'div'

  const searchParams = useSearchParams()
  const [icon, setIcon] = useState<'caretDown' | 'caretUp'>('caretUp')

  useEffect(() => {
    if (!sortable) {
      return
    }
    const sortBy = searchParams.get('sortBy')
    const direction = searchParams.get('direction')
    if (sortBy === name) {
      setIcon(direction === 'asc' ? 'caretUp' : 'caretDown')
    } else {
      setIcon('caretUp')
    }
  }, [searchParams])

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
        paddingLeft: [1, 2],
        paddingRight: [1, 2],
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
            paddingX={[1, 2]}
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
        {sortable && <Icon icon={icon} color="blue400" size="small" />}
      </Wrapper>
    </T.HeadData>
  )
}
