'use client'

import { useSession } from 'next-auth/react'

import { Header } from '@dmr.is/ui/components/Header/Header'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'
import { GridColumn} from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { ProblemFromError } from '@dmr.is/ui/components/Problem/ProblemFromError'

export default function Error({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const session = useSession()
  const isValidSession = session.data && !session.data.invalid


  return (
    <>
      {isValidSession ? <Header /> : <HeaderLogin variant="white" />}
      <GridContainer>
        <GridColumn
          paddingTop={[6,8]}
          paddingBottom={[6,8]}
          span={['12/12', '12/12', '10/12']}
          offset={['0', '0', '1/12']}
        >
          <ProblemFromError variant="bordered" titleSize="h1" error={error} />
        </GridColumn>
      </GridContainer>
    </>
  )
}
