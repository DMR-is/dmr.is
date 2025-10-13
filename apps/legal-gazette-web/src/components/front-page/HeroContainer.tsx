'use client'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { LinkCard } from '@dmr.is/ui/components/LinkCard/LinkCard'

import { GridColumn, GridRow } from '@island.is/island-ui/core'

import { Route } from '../../lib/constants'

export const HeroContainer = () => {
  return (
    <Hero
      title="Lögbirtingablað"
      description="Umsýslukerfi Lögbirtingablaðs, morem ipsum dolor sit amet, consectetur adipiscing elit."
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
            description="Umsýsla frá innsendingu til útgáfu."
            image={{
              src: '/assets/ritstjorn-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[2, 0]}>
          <LinkCard
            href={Route.UTGAFA}
            title="Útgáfa"
            description="Umsýsla frá innsendingu til útgáfu."
            image={{
              src: '/assets/utgafa-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[0]}>
          <LinkCard
            href={Route.HEILDARYFIRLIT}
            title="Heildarlisti"
            description="Öll mál, bæði í vinnslu og útgefin."
            image={{
              src: '/assets/heildar-image.svg',
            }}
          />
        </GridColumn>
      </GridRow>
    </Hero>
  )
}
