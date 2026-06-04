'use client'

import { Hero } from '@dmr.is/ui/components/Hero/Hero'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { LinkCard } from '@dmr.is/ui/components/LinkCard/LinkCard'

import { frontPageText } from '../../lib/text'

type Props = {
  userName?: string | null
}

export const HeroContainer = ({ userName }: Props) => {
  const paths = {
    innsendingar: {
      title: 'Innsendingar',
      href: '/yfirlit',
    },
    jafnrettisaetlanir: {
      title: 'Jafnréttisáætlanir',
      href: '/yfirlit?type=EQUALITY',
    },
    urbotaaetlanir: {
      title: 'Úrbótaáætlanir',
      href: '/yfirlit?hasImprovementPlan=true',
    },
    skyrslur: { title: 'Skýrslur', href: '/yfirlit?type=SALARY' },
  }
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
            href={paths.innsendingar.href}
            title={paths.innsendingar.title}
            description={frontPageText.heildarlisti.description}
            image={{
              src: '/assets/ritstjorn-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '4/12']} paddingBottom={[2, 2, 0]}>
          <LinkCard
            href={paths.jafnrettisaetlanir.href}
            title={paths.jafnrettisaetlanir.title}
            description={frontPageText.jafnrettisaetlanir.description}
            image={{
              src: '/assets/utgafa-image.svg',
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '12/12', '4/12']} paddingBottom={[0]}>
          <LinkCard
            href={paths.urbotaaetlanir.href}
            title={paths.urbotaaetlanir.title}
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
