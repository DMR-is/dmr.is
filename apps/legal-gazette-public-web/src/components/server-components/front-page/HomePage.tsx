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
      href: '/auglysingar?typeId=065c3fd9-58d1-436f-9fb8-c1f5c214fa50&categoryId=7d0e4b20-2fdd-4ca9-895b-9e7792eca6e5',
      variant: 'blue',
    },
    {
      title: 'Innköllun dánarbúa',
      href: '/auglysingar?typeId=bc6384f4-91b0-48fe-9a3a-b528b0aa6468&categoryId=7d0e4b20-2fdd-4ca9-895b-9e7792eca6e5',
      variant: 'blue',
    },
    {
      title: 'Útgefin tölublöð',
      href: '/sidur/utgefintolublod',
      variant: 'purple',
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
              <Box
                style={{ marginTop: '-32px' }}
                paddingTop={0}
                paddingBottom={6}
              >
                <BannerSearch quickLinks={quickLinks} />
              </Box>
            </Hero>
          </GridColumn>
          <GridColumn
            span={['12/12', '12/12', '12/12', '10/12']}
            offset={['0', '0', '0', '1/12']}
          >
            <Text marginBottom={8}>
              Vegna athugsemda Persónuverndar hefur verið tekið fyrir leit í
              blaðinu í auglýsingaflokkum, sem varða fjárhagsmálefni
              einstaklinga og fyrirtækja, nema eftir útgáfudagsetningum og
              útgáfutímabilum. Þeir flokkar sem sæta þessari takmörkuðu leit
              eru: <br />
              Innkallanir, greiðsluaðlögun, greiðsluáskorun, nauðasamningar,
              nauðungarsala, skiptafundur, veðhafafundur, skiptalok, stefnur,
              svipting fjárræðis og kaupmáli, framhald uppboðs.
            </Text>
          </GridColumn>
        </GridRow>
      </GridContainer>

      <Box background="blue100" paddingY={8} marginBottom={8}>
        <GridContainer>
          <GridRow>
            <GridColumn span={['1/1', '1/1', '1/1', '12/12']}>
              <Text variant="h3" paddingBottom={3}>
                Nýjustu auglýsingar
              </Text>
              <Stack space={[2]}>
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
