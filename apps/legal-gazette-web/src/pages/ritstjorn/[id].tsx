import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { getServerSession } from 'next-auth'

import { useIntl } from 'react-intl'

import { deleteUndefined } from '@dmr.is/utils/client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

import { AdvertForm } from '../../components/Form/AdvertForm'
import { Form } from '../../components/Form/Form'
import { AdvertSidebar } from '../../components/Form/FormSidebar'
import { CaseProvider } from '../../context/case-context'
import { CaseDetailedDto } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { Route, Routes } from '../../lib/constants'
import { ritstjornSingleMessages } from '../../lib/messages/ritstjorn/single'
import { loginRedirect, routesToBreadcrumbs } from '../../lib/utils'
import { authOptions } from '../api/auth/[...nextauth]'

// we need this if we replace the breadcrumbs items so they match the server-side
const HeroNoSRR = dynamic(
  () => import('@dmr.is/ui/lazy/components/Hero/Hero'),
  {
    ssr: false,
  },
)

type Props = {
  initalCase: CaseDetailedDto
  intialAdvertId: string
}

export default function SingleCase({ initalCase, intialAdvertId }: Props) {
  const { formatMessage } = useIntl()
  const updatedRoutes = Routes.flatMap((route) => {
    if (route.path === Route.RITSTJORN_ID) {
      return {
        ...route,
        pathName: formatMessage(ritstjornSingleMessages.common.caseNumber, {
          caseNumber: initalCase.caseNumber,
        }),
      }
    }

    return route
  })

  const breadcrumbs = routesToBreadcrumbs(
    updatedRoutes,
    Route.RITSTJORN_ID,
    formatMessage(ritstjornSingleMessages.common.caseNumber, {
      caseNumber: initalCase.caseNumber,
    }),
  )

  return (
    <CaseProvider initalCase={initalCase} intialAdvertId={intialAdvertId}>
      <Box padding={6} background="purple100">
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
              <Form>
                <Stack space={4}>
                  <HeroNoSRR
                    noImageFullWidth={true}
                    withOffset={false}
                    variant="small"
                    breadcrumbs={{ items: breadcrumbs }}
                    title={formatMessage(ritstjornSingleMessages.common.title)}
                    description={formatMessage(
                      ritstjornSingleMessages.common.intro,
                    )}
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

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  resolvedUrl,
  params,
  query,
}) => {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return loginRedirect(resolvedUrl)
  }

  const client = getLegalGazetteClient('CaseApi', session.idToken)

  if (!params?.id) return { notFound: true }

  const initalCase = await client.getCase({
    id: Array.isArray(params.id) ? params.id[0] : params.id,
  })

  if (!query.tab) {
    const advertId = initalCase.adverts[0]?.id
    return {
      redirect: {
        destination: `/ritstjorn/${initalCase.id}?tab=${advertId}`,
        permanent: false,
      },
    }
  }

  return {
    props: deleteUndefined({
      layoutProps: {
        headerVariant: 'white',
      },
      initalCase: deleteUndefined(initalCase),
      intialAdvertId: query.tab
        ? Array.isArray(query.tab)
          ? query.tab[0]
          : query.tab
        : initalCase.adverts[0].id,
      session,
    }),
  }
}
