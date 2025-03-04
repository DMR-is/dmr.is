import {
  Hero,
  ImagePanel,
  LinkCard,
  PieChart,
  Section,
  TrackerTable,
  Wrapper,
} from '@dmr.is/ui'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

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
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '7/12']}>
              <Stack space={3}>
                <Wrapper title="Ritstjórn" link="#" linkText="Opna ritstjórn">
                  <TrackerTable
                    rows={[
                      { text: '12 innsend mál hafa ekki verið opnuð' },
                      { text: 'Borist hafa ný svör í 4 málum' },
                      { text: '4 innsend mál eru með ósk um hraðbirtingu' },
                      {
                        text: '0 mál í yfirlestri eru með ósk um hraðbirtingu',
                      },
                    ]}
                  />
                </Wrapper>
                <Wrapper title="Útgáfa" link="#" linkText="Opna útgáfuferli">
                  <TrackerTable
                    rows={[
                      { text: '9 tilbúin mál eru áætluð til útgáfu í dag.' },
                      {
                        text: '2 mál í yfirlestri eru með liðinn birtingardag.',
                      },
                    ]}
                  />
                </Wrapper>
              </Stack>
            </GridColumn>
            <GridColumn span={['12/12', '5/12']}>
              <Wrapper title="Tölfræði" link="#" linkText="Sjá alla tölfræði">
                <PieChart
                  intro="Staða óútgefinna mála."
                  items={[
                    {
                      color: 'dark400',
                      title: 'Innsent',
                      count: 1,
                      percentage: 50,
                    },
                    {
                      color: 'blue400',
                      title: 'Grunnvinnsla',
                      count: 2,
                      percentage: 50,
                    },
                    {
                      color: 'mint400',
                      title: 'Yfirlestur',
                      count: 1,
                      percentage: 50,
                    },
                    {
                      color: 'roseTinted400',
                      title: 'Tilbúið',
                      count: 1,
                      percentage: 50,
                    },
                  ]}
                />
              </Wrapper>
            </GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
      <Section>
        <Stack space={4}>
          <ImagePanel
            align="right"
            title="Nýskrá auglýsingu"
            description="Norem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
            link="#"
            linkText="Opna innsendingarkerfi"
            image={{
              src: '/assets/image-with-text-1.svg',
              alt: 'Image alt',
            }}
          />
          <ImagePanel
            title="Prentútgáfa"
            description="Rorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
            link="#"
            linkText="Sækja prentútgáfu"
            image={{
              src: '/assets/image-with-text-2.svg',
              alt: 'Image alt',
            }}
          />
        </Stack>
      </Section>
    </main>
  )
}
