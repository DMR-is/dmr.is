import { FC, ReactElement } from 'react'

import { Box } from '@island.is/island-ui/core'

import * as styles from './FormStepper.css'

export const FormStepperV2: FC<
  React.PropsWithChildren<{
    sections?: ReactElement[]
  }>
> = ({ sections }) => {
  return (
    <Box width="full">
      {sections ? <Box className={styles.list}>{sections}</Box> : null}
    </Box>
  )
}
