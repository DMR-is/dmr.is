'use client'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { GridColumn} from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { LinkCard } from '@dmr.is/ui/components/LinkCard/LinkCard'

import { Route } from '../../lib/constants'

export const HeroContainer = () => {
  return (
    <Hero
      title="Lögbirtingablað"
      description="Umsýslukerfi Lögbirtingablaðsins, allt frá innsendingu til útgáfu. Ásamt yfirliti yfir útgefin mál. Lögbirtingablað hefur verið gefið út á prenti frá 2. Janúar 1908 en rafræn útgáfa hófst 1. júlí 2005."
      image={{
        src: '/assets/banner-image.svg',
        alt: 'Image alt',
      }}
    >
      <GridRow>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[2, 0]}>
          <LinkCard
            href={Route.RITSTJORN}
            title="Ritstjórn"
            description="Umsýsla frá innsendingu, í vinnslu og til útgáfu."
            image={{
              src: '/assets/ritstjorn-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[2, 0]}>
          <LinkCard
            href={Route.RITSTJORN + '?tab=utgafa-auglysinga'}
            title="Útgáfa"
            description="Mál sem eru tilbúin til útgáfu."
            image={{
              src: '/assets/utgafa-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[0]}>
          <LinkCard
            href={Route.RITSTJORN + '?tab=yfirlit'}
            title="Heildarlisti"
            description="Öll mál. Útgefin, í vinnslu og hafnað."
            image={{
              src: '/assets/heildar-image.svg',
            }}
          />
        </GridColumn>
      </GridRow>
    </Hero>
  )
}
