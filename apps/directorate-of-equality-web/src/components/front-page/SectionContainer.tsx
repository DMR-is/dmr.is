'use client'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Section } from '@dmr.is/ui/components/Section/Section'
import { TrackerTable } from '@dmr.is/ui/components/Tables/TrackerTable'
import { Wrapper } from '@dmr.is/ui/components/Wrapper/Wrapper'

export const SectionContainer = () => {
  return (
    <Section bleed variant="blue">
      <GridContainer>
        <Text variant="h3" fontWeight="semiBold" marginBottom={3}>
          Staða mála
        </Text>
        <GridRow>
          <GridColumn span={['12/12', '7/12']}>
            <Stack space={3}>
              <Wrapper title="Mál" link="/mal" linkText="Opna mál">
                <TrackerTable
                  rows={[
                    { text: '5 ný mál skráð í dag' },
                    { text: '12 mál í vinnslu' },
                    { text: '3 mál með skráðar athugasemdir' },
                    { text: '2 mál án skráðs starfsmanns' },
                  ]}
                />
              </Wrapper>
              <Wrapper
                title="Kvartanir"
                link="/kvartanir"
                linkText="Opna kvartanir"
              >
                <TrackerTable
                  rows={[
                    { text: '4 kvartanir tilbúnar til afgreiðslu' },
                    { text: '1 kvörtun með liðinn frest' },
                  ]}
                />
              </Wrapper>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '5/12']}>
            <Wrapper title="Tölfræði">
              <TrackerTable
                rows={[
                  { text: '8 opin mál samtals' },
                  { text: '5 mál í vinnslu' },
                  { text: '3 mál lokið í þessum mánuði' },
                ]}
              />
            </Wrapper>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
