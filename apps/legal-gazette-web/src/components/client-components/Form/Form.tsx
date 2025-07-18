'use client'

import { Box } from '@island.is/island-ui/core'

import * as styles from './Form.css'

type FormProps = {
  children?: React.ReactNode
}

export const Form = ({ children }: FormProps) => {
  return <Box className={styles.formStyles}>{children}</Box>
}
