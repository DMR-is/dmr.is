'use client'

import { Box } from '@island.is/island-ui/core'

import { useApplicationType } from '../../../../hooks/useApplicationType'
import * as styles from './application-footer.css'
import { BankruptcyFooter } from './BankruptcyFooter'

export const ApplicationFooter = () => {
  const applicationType = useApplicationType()

  if (!applicationType) {
    return null
  }

  return (
    <Box
      paddingY={[3, 5]}
      paddingX={[9, 12]}
      background="white"
      borderTopWidth="standard"
      borderColor="purple100"
      className={styles.shellFooter}
    >
      {applicationType === 'bankruptcy' && <BankruptcyFooter />}
      {applicationType === 'estate' && (
        <Box component="p" color="dark400">
          Umsókn um innköllun dánarbús
        </Box>
      )}
      {applicationType === 'common' && (
        <Box component="p" color="dark400">
          Almenn umsókn
        </Box>
      )}
    </Box>
  )
}
