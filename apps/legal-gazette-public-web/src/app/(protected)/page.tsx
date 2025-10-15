import { getServerSession } from 'next-auth'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { PublicationCard } from '../../components/client-components/cards/PublicationCard'
import { BannerSearch } from '../../components/client-components/front-page/banner-search/BannerSearch'
import { authOptions } from '../../lib/authOptions'
import { trpc } from '../../lib/trpc/client'
import { getTrpcServer } from '../../lib/trpc/server/server'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session?.idToken) {
    throw new Error('Unauthorized')
  }

  const quickLinks: React.ComponentProps<typeof BannerSearch>['quickLinks'] = [
    {
      title: 'Allar auglýsingar',
      href: '/auglysingar',
      variant: 'blue',
    },
    {
      title: 'Innköllun þrotabúa',
      href: '/auglysingar?type=innkollun-throtabu',
      variant: 'purple',
    },
    {
      title: 'Innköllun dánarbúa',
      href: '/auglysingar?type=innkollun-danarbua',
      variant: 'purple',
    },
  ]

  const breadcrumbItems: React.ComponentProps<typeof Hero>['breadcrumbs'] = {
    items: [
      {
        title: 'Lögbirtingablaðið',
      },
    ],
  }

  const { trpc } = await getTrpcServer()

  const latestPublications = await trpc.publicationApi.getPublications({
    page: 1,
    pageSize: 5,
  })

  return (
    <>
      <Hero
        title="Lögbirtingablaðið"
        description="Um útgáfu Lögbirtingablaðsins gilda lög um Stjórnartíðindi og Lögbirtingarblaðsins nr. 15/2005"
        withOffset={false}
        contentSpan={['1/1', '1/1', '1/1', '9/12', '7/12']}
        imageSpan={'3/12'}
        image={{ src: '/images/banner-image.svg' }}
        breadcrumbs={breadcrumbItems}
      >
        <Box paddingBottom={8}>
          <BannerSearch quickLinks={quickLinks} />
        </Box>
      </Hero>
      <Box background="blue100" paddingY={8}>
        <GridContainer>
          <GridRow>
            <GridColumn span={['1/1', '1/1', '1/1', '12/12']}>
              <Stack space={[2, 3, 4]}>
                <Text variant="h2">Nýjustu auglýsingar</Text>
                {latestPublications.publications.map((pub) => (
                  <PublicationCard publication={pub} key={pub.id} />
                ))}
              </Stack>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </>
  )
}
