'use client'

import { Box } from '@island.is/island-ui/core'

import * as styles from './application-footer.css'

type Props = {
  children?: React.ReactNode
}

export const ApplicationFooter = ({ children }: Props) => {
  return (
    <Box
      paddingY={[3, 5]}
      paddingX={[9, 12]}
      background="white"
      borderTopWidth="standard"
      borderColor="purple100"
      className={styles.shellFooter}
    >
      {children}
    </Box>
  )
}
