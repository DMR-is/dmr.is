import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'

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
import { routesToBreadcrumbs } from '../../lib/utils'

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
  const updatedRoutes = Routes.flatMap((route) => {
    if (route.path === Route.RITSTJORN_ID) {
      return {
        ...route,
        // pathName: `Mál nr. ${initalCase.caseNumber}`,
      }
    }

    return route
  })

  const breadcrumbs = routesToBreadcrumbs(
    updatedRoutes,
    Route.RITSTJORN_ID,
    // `Mál nr. ${initalCase.caseNumber}`,
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
                    title="Vinnslusvæði Lögbirtingablaðs"
                    description="Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
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
  params,
  query,
}) => {
  const client = getLegalGazetteClient('CaseApi', 'todo:add-token')

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
    props: {
      layoutProps: {
        headerVariant: 'white',
      },
      initalCase: deleteUndefined(initalCase),
      intialAdvertId: query.tab
        ? Array.isArray(query.tab)
          ? query.tab[0]
          : query.tab
        : initalCase.adverts[0].id,
    },
  }
}
