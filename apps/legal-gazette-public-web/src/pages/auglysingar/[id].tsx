import { GetServerSideProps } from 'next'
import { getServerSession, Session } from 'next-auth'
import { parseAsString } from 'next-usequerystate'

import { deleteUndefined } from '@dmr.is/utils/client'

import {
  Breadcrumbs,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  LinkV2,
  Stack,
} from '@island.is/island-ui/core'

import { AdvertDisplay } from '../../components/advert-display/AdvertDisplay'
import { AdvertInfo } from '../../components/advert-info/AdvertInfo'
import { AdvertDto } from '../../gen/fetch'
import { authOptions } from '../../lib/auth/authOptions'
import { PageRoutes } from '../../lib/constants'
import { getClient } from '../../lib/createClient'
import { safeCall } from '../../lib/utils'

type SinglPageProps = {
  advert: AdvertDto
}

export default function SingleAdvertPage({ advert }: SinglPageProps) {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '12/12', '4/12']}>
          <Stack space={3}>
            <LinkV2 href={PageRoutes.AUGLYSINGAR}>
              <Button size="small" variant="text" preTextIcon="arrowBack">
                Til baka
              </Button>
            </LinkV2>
            <AdvertInfo advert={advert} />
          </Stack>
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '8/12']}>
          <Stack space={4}>
            <Breadcrumbs
              items={[
                { title: 'Lögbirtingarblaðið' },
                { title: 'Auglýsingar', href: PageRoutes.AUGLYSINGAR },
                { title: `Auglýsing ${advert.publicationNumber}` },
              ]}
            />

            <AdvertDisplay advert={advert} />
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}

export const getServerSideProps: GetServerSideProps<SinglPageProps> = async ({
  req,
  res,
  params,
}) => {
  const session = (await getServerSession(req, res, authOptions)) as Session

  const client = getClient(session.idToken)

  const idParam = parseAsString.parseServerSide(params?.id)

  if (!idParam) {
    return {
      notFound: true,
    }
  }

  const advertResponse = await safeCall(() =>
    client.getAdvertById({ id: idParam }),
  )

  if (!advertResponse.data) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      advert: deleteUndefined(advertResponse.data),
    },
  }
}
