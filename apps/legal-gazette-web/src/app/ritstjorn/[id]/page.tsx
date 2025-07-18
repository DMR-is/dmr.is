import { notFound, redirect } from 'next/navigation'
import { getServerSession, Session } from 'next-auth'
import { parseAsString } from 'next-usequerystate'

import { serverFetcher } from '@dmr.is/api-client/fetchers'
import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { authOptions } from '../../../app/api/auth/[...nextauth]/route'
import { AdvertForm } from '../../../components/client-components/Form/AdvertForm'
import { Form } from '../../../components/client-components/Form/Form'
import { AdvertSidebar } from '../../../components/client-components/Form/FormSidebar'
import { HeroNoSSRWrapper } from '../../../components/client-components/Messages/HeroNoSSRWrapper'
import { CaseProvider } from '../../../context/case-context'
import { getLegalGazetteClient } from '../../../lib/api/createClient'
// import { ritstjornSingleMessages } from '../../../lib/messages/ritstjorn/single'

type Props = {
  params: {
    id: string
  }
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SingleCase({ params, searchParams }: Props) {
  const session = (await getServerSession(authOptions)) as Session
  const client = getLegalGazetteClient('CaseApi', session.idToken)

  const caseId = parseAsString.parseServerSide(params?.id)
  const selectedTab = (await searchParams).tab as string | undefined

  if (!caseId) return notFound()

  const { data: initalCase } = await serverFetcher(() =>
    client.getCase({
      id: caseId,
    }),
  )
  if (!initalCase) {
    return notFound()
  }

  if (!selectedTab) {
    const advertId = initalCase.adverts[0]?.id
    redirect(`/ritstjorn/${initalCase.id}?tab=${advertId}`)
  }

  return (
    <CaseProvider initalCase={initalCase} intialAdvertId={selectedTab}>
      <Box padding={6} background="purple100">
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
              <Form>
                <Stack space={4}>
                  <HeroNoSSRWrapper
                    // namespace={ritstjornSingleMessages}
                    caseNumber={initalCase.caseNumber}
                  />
                  <AdvertForm />
                </Stack>
              </Form>
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
              <AdvertSidebar />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </CaseProvider>
  )
}
