import { Hero, LinkCard, Section } from '@dmr.is/ui'

import { GridColumn, GridRow } from '@island.is/island-ui/core'

export default function PlayGroundPage() {
  return (
    <main>
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
              href="#"
              title="Ritstjórn"
              description="Umsýsla frá innsendingu til útgáfu."
              image={{
                src: '/assets/ritstjorn-image.svg',
              }}
            />
          </GridColumn>
          <GridColumn span={['12/12', '4/12']} paddingBottom={[2, 0]}>
            <LinkCard
              href="#"
              title="Útgáfa"
              description="Umsýsla frá innsendingu til útgáfu."
              image={{
                src: '/assets/utgafa-image.svg',
              }}
            />
          </GridColumn>
          <GridColumn span={['12/12', '4/12']} paddingBottom={[0]}>
            <LinkCard
              href="#"
              title="Heildarlisti"
              description="Öll mál, bæði í vinnslu og útgefin."
              image={{
                src: '/assets/heildar-image.svg',
              }}
            />
          </GridColumn>
        </GridRow>
      </Hero>
      <Section bleed variant="blue">
        <h2>Hallo</h2>
      </Section>
    </main>
  )
}
