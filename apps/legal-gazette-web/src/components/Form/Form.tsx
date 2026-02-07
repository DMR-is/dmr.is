'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'

import * as styles from './Form.css'

type FormProps = {
  children?: React.ReactNode
}

export const Form = ({ children }: FormProps) => {
  return <Box className={styles.formStyles}>{children}</Box>
}
