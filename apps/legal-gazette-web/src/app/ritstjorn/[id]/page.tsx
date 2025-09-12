import { getServerSession } from 'next-auth'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { AdvertForm } from '../../../components/client-components/Form/AdvertForm'
import { Form } from '../../../components/client-components/Form/Form'
import { AdvertProvider } from '../../../context/advert-context'
import { getLegalGazetteClient } from '../../../lib/api/createClient'
import { authOptions } from '../../../lib/auth/authOptions'

type Props = {
  params: {
    id: string
  }
}

export default async function AdvertDetails({ params }: Props) {
  const session = await getServerSession(authOptions)

  if (!session?.idToken) {
    return <div>Not signed in</div>
  }

  const advertClient = getLegalGazetteClient('AdvertApi', session.idToken)
  const typesClient = getLegalGazetteClient('TypeApi', session.idToken)
  const categoriesClient = getLegalGazetteClient('CategoryApi', session.idToken)
  const advert = await advertClient.getAdvertById({ id: params.id })
  const { types } = await typesClient.getTypes()
  const { categories } = await categoriesClient.getCategories({
    type: advert.type.id,
  })

  return (
    <AdvertProvider advert={advert} categories={categories} types={types}>
      <Box padding={6} background="purple100">
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '12/12', '9/12', '9/12']}>
              <Form>
                <Stack space={4}>
                  <AdvertForm />
                </Stack>
              </Form>
            </GridColumn>
            <GridColumn span={['12/12', '12/12', '3/12', '3/12']}>
              {/* <AdvertSidebar /> */}
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </AdvertProvider>
  )
}
