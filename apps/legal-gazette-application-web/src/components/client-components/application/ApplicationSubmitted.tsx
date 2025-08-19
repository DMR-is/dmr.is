'use client'

import {
  Box,
  Button,
  DropdownMenu,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  LinkV2,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { AdvertDto } from '../../../gen/fetch'
import { PageRoutes } from '../../../lib/constants'
import { AddAdvertsToApplicationMenu } from '../adverts/AddAdvertsToApplicationMenu'
import { AdvertList } from '../adverts/AdvertList'

type Props = {
  caseId: string
  adverts: AdvertDto[]
}

export const ApplicationSubmitted = ({ caseId, adverts }: Props) => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Box background="white" borderRadius="large" padding={[4, 5, 6]}>
            <Stack space={[4, 5, 6]}>
              <Stack space={[2, 3, 4]}>
                <Inline justifyContent="spaceBetween" alignY="center">
                  <Text variant="h2">Auglýsingar tegndar umsókninni</Text>
                  <LinkV2 href={PageRoutes.APPLICATIONS}>
                    <Button preTextIcon="arrowBack" variant="text" size="small">
                      Tilbaka í yfirlit
                    </Button>
                  </LinkV2>
                </Inline>
                <GridRow>
                  <GridColumn span={['12/12', '9/12']}>
                    <Text>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua.
                    </Text>
                  </GridColumn>
                  <GridColumn span={['12/12', '3/12']}>
                    <Inline align="right">
                      <AddAdvertsToApplicationMenu caseId={caseId} />
                    </Inline>
                  </GridColumn>
                </GridRow>
              </Stack>
              <AdvertList adverts={adverts} />
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
