'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { useEffect } from 'react'

import { forceLogin } from '@dmr.is/auth/useLogOut'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'

export default function Error({ reset, error }: { error: Error; reset: () => void }) {
  const pathName = usePathname()
  const { data: session, status } = useSession()
  console.log('error', error)

  useEffect(() => {
    if (session?.invalid === true && status === 'authenticated') {
      // Make sure to log out if the session is invalid
      // This is just a front-end logout for the user's convenience
      // The session is invalidated on the server side
      forceLogin(pathName ?? '/innskraning')
    }
  }, [session?.invalid, status, pathName])
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '10/12']}
          offset={['0', '1/12']}
          paddingBottom={3}
        >
          <Text variant="h2">Eitthvað fór úrskeiðis!</Text>
          <Button variant="utility" onClick={() => reset()}>
            Reyna aftur
          </Button>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
