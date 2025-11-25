'use client'

import {
  Box,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { Link } from '@island.is/island-ui/core'

export default function Page() {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          span={['12/12', '12/12', '12/12', '8/12']}
          offset={['0', '0', '0', '1/12']}
        >
          <Stack space={6}>
            <Stack space={2}>
              <Text variant="h2" as="h1">
                Áskriftarskilmálar netúgáfu Lögbirtingablaðs
              </Text>
              <Text variant="intro">
                Skilmálar fyrir áskrift að netúgáfu Lögbirtingablaðs eru
                eftirfarandi:
              </Text>

              <Text>
                Ekki er leyfilegt að afrita efni Lögbirtingablaðs til dreifingar
                eða til að safna saman upplýsingum um einstaka aðila,
                einstaklinga eða lögaðila.
              </Text>
            </Stack>

            <Stack space={2}>
              <Text variant="h2" as="h2">
                Áskriftarskilmálar prentaðrar útgáfu Lögbirtingablaðs
              </Text>
              <Text variant="intro">
                Skilmálar fyrir áskrift að prentaðri útgáfu Lögbirtingablaðs eru
                eftirfarandi:
              </Text>

              <Text>
                Áskrifandi pantar áskrift með símtali til skrifstofu
                Lögbirtingablaðs eða sendir tölvupóst á netfangið [email
                protected] eða sendir fax í númerið 458 2860. Prentuð útgáfa
                Lögbirtingablaðs verður þá send viðkomandi.
              </Text>
              <Text>
                Áskriftargjald að prentaðri útgáfu Lögbirtingablaðs er kr.
                82.000 á ári sem greiðist fyrirfram.
              </Text>
              <Text>
                Ath. netútgáfa Lögbirtingablaðs er hin lögformlega útgáfa en
                prentaða útgáfan er yfirlit yfir það sem gefið hefur verið út,
                geta því réttaráhrif auglýsinga verið liðin þegar prentaða
                útgáfan berst áskrifanda.
              </Text>
            </Stack>
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
