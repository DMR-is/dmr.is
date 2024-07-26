import { Box, Table as T, UseBoxStylesProps } from '@island.is/island-ui/core'

import * as styles from './CaseTable.css'
type Props = {
  fixed?: boolean
  children?: React.ReactNode
  boxStyles?: Omit<UseBoxStylesProps, 'component'>
}

export const TableCell = ({ children, boxStyles, fixed }: Props) => {
  const fixedStyles: React.CSSProperties = {
    position: 'sticky',
    backgroundColor: 'inherit',
    boxShadow: '4px 0px 4px 0px #0161FD1A',
    left: 0,
  }

  const tableStyles = {
    ...(fixed && fixedStyles),
  }

  return (
    <T.Data
      style={tableStyles}
      box={{
        paddingLeft: [1, 2],
        paddingRight: [1, 2],
        paddingTop: [1, 2],
        paddingBottom: [1, 2],
        ...boxStyles,
      }}
    >
      {fixed && (
        <Box
          paddingX={[1, 2]}
          paddingY={[1, 2]}
          className={styles.fixedCellWrapper}
        />
      )}
      {children}
    </T.Data>
  )
}
