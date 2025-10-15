'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'

import { Box, Button, Inline, LinkV2 } from '@island.is/island-ui/core'

import { PageRoutes } from '../../../../lib/constants'
import * as styles from './application-footer.css'

export const ApplicationFooter = () => {
  const { formState, trigger } = useFormContext()

  console.log(formState.errors)

  return (
    <Box
      paddingY={[3, 5]}
      paddingX={[9, 12]}
      background="white"
      borderTopWidth="standard"
      borderColor="purple100"
      className={styles.shellFooter}
    >
      <Inline justifyContent="spaceBetween" alignY="center">
        <LinkV2 href={PageRoutes.APPLICATIONS}>
          <Button preTextIcon="arrowBack" variant="ghost">
            Yfirlit
          </Button>
        </LinkV2>
        <Button type="submit" icon="arrowForward" disabled={!formState.isValid}>
          Senda til birtingar
        </Button>
      </Inline>
    </Box>
  )
}
