import { Box, Table as T } from '@island.is/island-ui/core'

import * as styles from './CaseTable.css'
type Props = {
  fixed?: boolean
  children?: React.ReactNode
}

export const TableCell = ({ children, fixed }: Props) => {
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
        paddingLeft: [1, 2, 3],
        paddingRight: [1, 2, 3],
        paddingTop: [1, 2],
        paddingBottom: [1, 2],
      }}
    >
      {fixed && (
        <Box
          paddingX={[1, 2, 3]}
          paddingY={[1, 2]}
          className={styles.fixedCellWrapper}
        />
      )}
      {children}
    </T.Data>
  )
}
