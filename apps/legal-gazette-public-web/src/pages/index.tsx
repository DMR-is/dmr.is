import { Hero } from '@dmr.is/ui/components/Hero/Hero'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
} from '@island.is/island-ui/core'

import { BannerSearch } from '../components/banner-search/BannerSearch'
import { LatestAdverts } from '../components/latest-adverts/LatestAdverts'

export function Index() {
  const quickLinks: React.ComponentProps<typeof BannerSearch>['quickLinks'] = [
    {
      title: 'Almennar auglýsingar',
      href: '/auglysingar?type=almenn-auglysing',
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
              <LatestAdverts />
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Box>
    </>
  )
}

export default Index
