'use client'

import { PieChart } from '@dmr.is/ui/components/PieChart/PieChart'
import { Section } from '@dmr.is/ui/components/Section/Section'
import { TrackerTable } from '@dmr.is/ui/components/Tables/TrackerTable'
import { Wrapper } from '@dmr.is/ui/components/Wrapper/Wrapper'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

import { Route } from '../../lib/constants'

export const SectionContainer = () => {
  return (
    <Section bleed variant="blue">
      <GridContainer>
        <GridRow>
          <GridColumn span={['12/12', '7/12']}>
            <Stack space={3}>
              <Wrapper
                title="Ritstjórn"
                link={Route.RITSTJORN}
                linkText="Opna ritstjórn"
              >
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
              <Wrapper
                title="Útgáfa"
                link={Route.UTGAFA}
                linkText="Opna útgáfuferli"
              >
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
  )
}
