'use client'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { PageRoutes } from '../../../lib/constants'
import { ActionCard } from '../cards/ActionCard'

export const ApplicationTypes = () => {
  return (
    <Box paddingY={6}>
      <GridContainer>
        <GridRow>
          <GridColumn
            paddingTop={3}
            paddingBottom={3}
            span={['12/12', '10/12']}
            offset={['0', '1/12']}
          >
            <Stack space={4}>
              <Text variant="h2">Tegundir umsókna</Text>
              <Stack space={2}>
                <ActionCard
                  title="Almenn umsókn"
                  description="Hægt er að senda inn almennar umsóknir í gegnum Ísland.is"
                >
                  <a
                    href={PageRoutes.ISLAND_IS_COMMONA_APPLICATION}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button icon="arrowForward">Stofna umsókn</Button>
                  </a>
                </ActionCard>
                <ActionCard
                  title="Innköllun þrotabús"
                  description="Hér getur sent inn innköllun þrotabús"
                  link={{
                    label: 'Stofna umsókn',
                    href: PageRoutes.APPLICATION_THROTABU,
                  }}
                />
                <ActionCard
                  title="Innköllun dánarbús"
                  description="Hér getur sent inn innköllun dánarbús"
                  link={{
                    label: 'Stofna umsókn',
                    href: PageRoutes.APPLICATION_DANARBU,
                  }}
                />
              </Stack>
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Box>
  )
}
