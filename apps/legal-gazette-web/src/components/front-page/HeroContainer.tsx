'use client'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { LinkCard } from '@dmr.is/ui/components/LinkCard/LinkCard'

import { GridColumn, GridRow } from '@island.is/island-ui/core'

import { Route } from '../../lib/constants'

export const HeroContainer = () => {
  const breadcrumbs = {
    items: [
      {
        title: 'Umsýslukerfi',
      },
    ],
  }

  return (
    <Hero
      breadcrumbs={breadcrumbs}
      title="Lögbirtingablað"
      description="Umsýslukerfi Lögbirtingablaðsins. Yfirlit yfir ritsjórn, útgáfu og tölfræði. Lögbirtingablað hefur verið gefið út á prenti frá 2. Janúar 1908 en rafræn útgáfa hófst 1. júlí 2005."
      image={{
        src: '/assets/banner-image.svg',
        alt: 'Image alt',
      }}
    >
      <GridRow>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[2, 0]}>
          <LinkCard
            href={Route.RITSTJORN}
            title="Innsent / í vinnslu"
            description="Yfirlit yfir innsend mál og þau sem eru í vinnslu."
            image={{
              src: '/assets/ritstjorn-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[2, 0]}>
          <LinkCard
            href={Route.RITSTJORN + '?tab=utgafa'}
            title="Tilbúið til útgáfu"
            description="Yfirlit yfir mál sem eru tilbúin til útgáfu."
            image={{
              src: '/assets/utgafa-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[0]}>
          <LinkCard
            href={Route.RITSTJORN + '?tab=yfirlit'}
            title="Öll mál"
            description="Yfirlit yfir öll mál, innsend, í vinnslu, útgefin og hafnað."
            image={{
              src: '/assets/heildar-image.svg',
            }}
          />
        </GridColumn>
      </GridRow>
    </Hero>
  )
}
