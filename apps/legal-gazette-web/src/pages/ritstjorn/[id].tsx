import { GetServerSideProps } from 'next'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { Route } from '@dmr.is/ui/hooks/constants'
import { deleteUndefined } from '@dmr.is/utils/client'

import { Stack } from '@island.is/island-ui/core'

import { AdvertForm } from '../../components/Form/AdvertForm'
import { Form } from '../../components/Form/Form'
import { FormShell } from '../../components/Form/FormShell'
import { CaseDetailedDto } from '../../gen/fetch'
import { getLegalGazetteClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { routesToBreadcrumbs } from '../../lib/utils'

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

  return (
    <FormShell>
      <Form>
        <Stack space={4}>
          <Hero
            noImageFullWidth={true}
            withOffset={false}
            variant="small"
            breadcrumbs={{ items: breadcrumbs }}
            title="Vinnslusvæði Lögbirtingablaðs"
            description="Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
          />
          <AdvertForm adverts={currentCase.adverts} />
        </Stack>
      </Form>
    </FormShell>
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
