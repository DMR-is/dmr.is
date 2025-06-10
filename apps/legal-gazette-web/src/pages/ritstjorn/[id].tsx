import { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'

import { useState } from 'react'

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
import { CaseDetailedDto } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { Route, Routes } from '../../lib/constants'
import { routesToBreadcrumbs } from '../../lib/utils'

// we need this if we replace the breadcrumbs items so they match the server-side
const HeroNoSRR = dynamic(() => import('@dmr.is/ui/components/Hero/Hero'), {
  ssr: false,
})

const TextInput = dynamic(() =>
  import('@dmr.is/ui/components/Inputs/TextInput').then((mod) => mod),
)

type Props = {
  currentCase: CaseDetailedDto
}

export default function SingleCase({ currentCase }: Props) {
  const updatedRoutes = Routes.flatMap((route) => {
    if (route.path === Route.RITSTJORN_ID) {
      return {
        ...route,
        pathName: `Mál nr. ${currentCase.caseNumber}`,
      }
    }

    return route
  })

  const breadcrumbs = routesToBreadcrumbs(
    updatedRoutes,
    Route.RITSTJORN_ID,
    `Mál nr. ${currentCase.caseNumber}`,
  )

  const [selectedAdvert, setSelectedAdvert] = useState(currentCase.adverts[0])

  return (
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
                <AdvertForm
                  onAdvertSelect={(id) =>
                    setSelectedAdvert(
                      currentCase.adverts.find((ad) => ad.id === id) ??
                        currentCase.adverts[0],
                    )
                  }
                  adverts={currentCase.adverts}
                />
              </Stack>
            </Form>
          </GridColumn>
          <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
            <AdvertSidebar advert={selectedAdvert} />
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const client = getLegalGazetteClient('CaseApi', 'todo:add-token')

  if (!params?.id) return { notFound: true }

  const currentCase = await client.getCase({
    id: Array.isArray(params.id) ? params.id[0] : params.id,
  })

  return {
    props: {
      layoutProps: {
        headerVariant: 'white',
      },
      currentCase: deleteUndefined(currentCase),
    },
  }
}
