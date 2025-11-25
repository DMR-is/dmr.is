import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { Footer } from '@dmr.is/ui/components/Footer/Footer'
import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { trpc } from '../../../lib/trpc/client/server'
import { PublicationCard } from '../../client-components/cards/PublicationCard'
import { BannerSearch } from '../../client-components/front-page/banner-search/BannerSearch'

export const HomePage = async () => {
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
    {
      title: 'Prentuð útgáfa',
      href: '/sidur/prentudutgafa',
      variant: 'darkerBlue',
    },
  ]

  const latestPublications = await fetchQueryWithHandler(
    trpc.getPublications.queryOptions({
      page: 1,
      pageSize: 5,
    }),
  )

  return (
    <>
      <GridContainer>
        <GridRow>
          <GridColumn
            span={['12/12', '12/12', '12/12', '10/12']}
            offset={['0', '0', '0', '1/12']}
          >
            <Hero
              title="Lögbirtingablað"
              contentSpan={['12/12', '12/12', '12/12', '7/12']}
              imageSpan={'4/12'}
              withOffset={false}
              image={{ src: '/images/hero-page-image.svg' }}
              description="Dómsmálaráðuneytið gefur út Lögbirtingablaðið. Það kom fyrst út í prentuðu formi í árið 1908 og í dag er blaðið einnig aðgengilegt á netinu þar sem hægt er að nálgast öll tölublöð sem komið hafa út frá 1. janúar 2001."
              alignHeader={'spaceBetween'}
            >
              <Box paddingBottom={8}>
                <BannerSearch quickLinks={quickLinks} />
              </Box>
            </Hero>
          </GridColumn>
        </GridRow>
      </GridContainer>

      <Box background="blue100" paddingY={8} marginBottom={8}>
        <GridContainer>
          <GridRow>
            <GridColumn span={['1/1', '1/1', '1/1', '12/12']}>
              <Stack space={[2, 3, 4]}>
                <Text variant="h3">Nýjustu auglýsingar</Text>
                {latestPublications.publications.map((pub) => (
                  <PublicationCard publication={pub} key={pub.id} />
                ))}
              </Stack>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
      <Footer />
    </>
  )
}
