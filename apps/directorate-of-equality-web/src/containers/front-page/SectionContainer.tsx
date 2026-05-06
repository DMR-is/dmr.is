'use client'

import dynamic from 'next/dynamic'

import { useState } from 'react'

import { theme } from '@dmr.is/island-ui-theme'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Section } from '@dmr.is/ui/components/Section/Section'
import { TrackerTable } from '@dmr.is/ui/components/Tables/TrackerTable'
import { Wrapper } from '@dmr.is/ui/components/Wrapper/Wrapper'

const PieChart = dynamic(
  () =>
    import('@dmr.is/ui-lazy/components/PieChart/PieChart').then(
      (mod) => mod.PieChart,
    ),
  { ssr: false },
)

export const SectionContainer = () => {
  const [selectedTab, setSelectedTab] = useState('almennt')

  return (
    <Section bleed variant="blue">
      <GridContainer>
        <Text variant="h3" fontWeight="semiBold" marginBottom={3}>
          Staða mála
        </Text>
        <GridRow>
          <GridColumn span={['12/12', '7/12']}>
            <Stack space={3}>
              {/* TODO NAVIGATE CORRECTLY AND PREFILTERED FOR MIN MAL */}
              <Wrapper title="Mál" link="/mal" linkText="Opna ristjórn">
                <Tabs
                  label="Mál flokkar"
                  selected={selectedTab}
                  onChange={setSelectedTab}
                  contentBackground="white"
                  tabs={[
                    {
                      id: 'almennt',
                      label: 'Almennt',
                      content: (
                        <TrackerTable
                          rows={[
                            { text: '5 ný mál skráð í dag' },
                            { text: '12 mál í vinnslu' },
                            { text: '3 mál með skráðar athugasemdir' },
                            { text: '2 mál án skráðs starfsmanns' },
                          ]}
                        />
                      ),
                    },
                    {
                      id: 'min-mal',
                      label: 'Mín mál',
                      content: (
                        <TrackerTable
                          rows={[
                            { text: '2 mál í vinnslu' },
                            { text: '1 mál með skráðar athugasemdir' },
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              </Wrapper>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '5/12']}>
            <Wrapper title="Tölfræði">
              <PieChart
                intro="Staða ólokaðra mála."
                items={[
                  {
                    color: theme.color.yellow600,
                    title: 'Ný mál',
                    count: 5,
                    percentage: 31,
                  },
                  {
                    color: theme.color.roseTinted400,
                    title: 'Í vinnslu',
                    count: 8,
                    percentage: 50,
                  },
                  {
                    color: theme.color.mint600,
                    title: 'Til afgreiðslu',
                    count: 3,
                    percentage: 19,
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
