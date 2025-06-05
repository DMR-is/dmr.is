import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import * as styles from './Form.css'
type FormShellProps = {
  children?: React.ReactNode
}

export const FormShell = ({ children }: FormShellProps) => {
  return (
    <Box className={styles.formShellStyles}>
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
            {children}
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
