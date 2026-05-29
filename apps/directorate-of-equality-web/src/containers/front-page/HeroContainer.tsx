'use client'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { LinkCard } from '@dmr.is/ui/components/LinkCard/LinkCard'

import { NAV_PATHS } from '../../lib/constants'
import { frontPageText } from '../../lib/text'

type Props = {
  userName?: string | null
}

export const HeroContainer = ({ userName }: Props) => {
  return (
    <Hero
      title={frontPageText.heroTitle}
      description={
        userName
          ? `Velkomin/n ${userName}. ${frontPageText.heroDescription}`
          : frontPageText.heroDescription
      }
      image={{
        src: '/assets/banner-image.svg',
        alt: frontPageText.heroImageAlt,
      }}
    >
      <GridRow>
        <GridColumn span={['12/12', '12/12', '4/12']} paddingBottom={[2, 2, 0]}>
          <LinkCard
            href={NAV_PATHS.heildarlisti.href}
            title={NAV_PATHS.heildarlisti.title}
            description={frontPageText.heildarlisti.description}
            image={{
              src: '/assets/ritstjorn-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '4/12']} paddingBottom={[2, 2, 0]}>
          <LinkCard
            href={NAV_PATHS.jafnrettisaetlanir.href}
            title={NAV_PATHS.jafnrettisaetlanir.title}
            description={frontPageText.jafnrettisaetlanir.description}
            image={{
              src: '/assets/utgafa-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '4/12']} paddingBottom={[0]}>
          <LinkCard
            href={NAV_PATHS.urbotaaetlanir.href}
            title={NAV_PATHS.urbotaaetlanir.title}
            description={frontPageText.urbotaaetlanir.description}
            image={{
              src: '/assets/heildar-image.svg',
            }}
          />
        </GridColumn>
      </GridRow>
    </Hero>
  )
}
