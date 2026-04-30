'use client'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { LinkCard } from '@dmr.is/ui/components/LinkCard/LinkCard'

type Props = {
  userName?: string | null
}

export const HeroContainer = ({ userName }: Props) => {
  const heroDescription =
    'Hér má finna jafnréttisáætlanir og skýrslur um kynjabundinn launamun, ásamt úrbótaáætlunum. '
  return (
    <Hero
      title="Ritstjórn Jafnréttisstofu"
      description={
        userName
          ? `Velkomin/n ${userName}. ${heroDescription}`
          : `${heroDescription}`
      }
      image={{
        src: '/assets/banner-image.svg',
        alt: 'Ritstjórn Jafnréttisstofu',
      }}
    >
      <GridRow>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[2, 0]}>
          <LinkCard
            href="/mal"
            title="Heildarlisti"
            description="Umsýsla frá innsendingu til útgáfu."
            image={{
              src: '/assets/ritstjorn-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[2, 0]}>
          <LinkCard
            href="/mal?category=jafnrettisaetlun"
            title="Jafnréttisáætlanir"
            description="Yfirlit jafnréttisáætlana og meðferð þeirra."
            image={{
              src: '/assets/utgafa-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '4/12']} paddingBottom={[0]}>
          <LinkCard
            href="/mal?category=urbotaaetlun"
            title="Úrbótaáætlanir"
            description="Yfirlit úrbótaáætlana og meðferð þeirra."
            image={{
              src: '/assets/heildar-image.svg',
            }}
          />
        </GridColumn>
      </GridRow>
    </Hero>
  )
}
