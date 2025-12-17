'use client'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { LinkCard } from '@dmr.is/ui/components/LinkCard/LinkCard'

import { GridColumn, GridRow } from '@island.is/island-ui/core'

import { Route, Routes } from '../../lib/constants'
import { routesToBreadcrumbs } from '../../lib/utils'

export const HeroContainer = () => {
  const breadcrumbs = routesToBreadcrumbs(Routes, Route.STJORNBORD)
  return (
    <Hero
      breadcrumbs={{ items: breadcrumbs }}
      title="Lögbirtingablað"
      description="Umsýslukerfi Lögbirtingablaðs. Hér á stjórnborði er yfirlit yfir ritsjórn, útgáfu og tölfræði."
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
