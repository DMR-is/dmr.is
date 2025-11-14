import { getServerSession } from 'next-auth'

import { fetchQueryWithHandler } from '@dmr.is/trpc/client/server'
import { HeaderLogin } from '@dmr.is/ui/components/Header/HeaderLogin'
import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { PublicationCard } from '../components/client-components/cards/PublicationCard'
import { BannerSearch } from '../components/client-components/front-page/banner-search/BannerSearch'
import { authOptions } from '../lib/authOptions'

export default async function HomePage() {
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

  return (
    <>
      <HeaderLogin />
      <Hero
        title="Lögbirtingablaðið frontpage"
        description="Frontpage útgáfu Lögbirtingablaðsins gilda lög um Stjórnartíðindi og Lögbirtingarblaðsins nr. 15/2005"
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
              </Stack>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </>
  )
}
