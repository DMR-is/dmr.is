import { getServerSession } from 'next-auth'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Swiper,
  Text,
} from '@dmr.is/ui/components/island-is'

import { PublicationCard } from '../../../../../../components/client-components/cards/PublicationCard'
import { authOptions } from '../../../../../../lib/authOptions'
import { getClient } from '../../../../../../lib/createClient'

export default async function RelatedPublications({
  params,
}: {
  params: { id: string; version: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.idToken) {
    throw new Error('Unauthorized')
  }

  const client = getClient(session.idToken)

  const relatedPubs = await client.getPublications({
    advertId: params.id,
  })
  const filtered = relatedPubs.publications.filter(
    (pub) => pub.advertId !== params.id && params.version !== pub.version,
  )

  if (filtered.length === 0) {
    return null
  }

  return (
    <Box background="blue100" padding={[4, 5, 6]}>
      <GridContainer>
        <GridRow>
          <GridColumn span="12/12">
            <Stack space={[3, 4]}>
              <Text variant="h3">Tengdar auglýsingar</Text>
              {filtered.length === 1 ? (
                <PublicationCard publication={filtered[0]} />
              ) : (
                <Swiper itemWidth={300}>
                  {filtered.map((pub) => (
                    <PublicationCard key={pub.id} publication={pub} />
                  ))}
                </Swiper>
              )}
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
