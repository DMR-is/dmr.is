import { Box } from '@island.is/island-ui/core'

import * as styles from './center.css'
type Props = {
  children?: React.ReactNode
  fullHeight?: boolean
}

export const Center = ({ children, fullHeight = false }: Props) => {
  return (
    <Box className={styles.centerStyles({ fullHeight: fullHeight })}>
      {children}
    </Box>
  )
}
