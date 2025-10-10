import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@dmr.is/ui/components/island-is'

import { AdvertForm } from '../../../../components/client-components/Form/AdvertForm'
import { Form } from '../../../../components/client-components/Form/Form'
import { AdvertSidebar } from '../../../../components/client-components/Form/FormSidebar'
import { AdvertProvider } from '../../../../context/advert-context'
import { getTrpcServer } from '../../../../lib/trpc/server/server'

type Props = {
  params: {
    id: string
  }
}

export default async function AdvertDetails({ params }: Props) {
  const { trpc } = await getTrpcServer()

  const advert = await trpc.advertApi.getAdvert({ id: params.id })
  const { categories, types, courtDistricts } =
    await trpc.baseEntity.getAllEntities()

  return (
    <AdvertProvider
      advert={advert}
      categories={categories}
      types={types}
      courtDistricts={courtDistricts}
    >
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
              <AdvertSidebar />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </AdvertProvider>
  )
}
