'use client'

import { useState } from 'react'

import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Inline,
  LinkV2,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { AdvertDto, ApplicationTypeEnum } from '../../gen/fetch'
import { PageRoutes } from '../../lib/constants'
import { AddAdvertsToApplicationMenu } from '../adverts/AddAdvertsToApplicationMenu'
import { AdvertList } from '../adverts/AdvertList'
import { AdvertTable } from '../adverts/AdvertTable'

type Props = {
  applicationType: ApplicationTypeEnum
  adverts: AdvertDto[]
}

export const ApplicationSubmitted = ({ adverts, applicationType }: Props) => {
  const [showAsCards, setShowAsCards] = useState(false)
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Box background="white" borderRadius="large" padding={[4, 5, 6]}>
            <Stack space={[4, 5, 6]}>
              <Stack space={[2, 3, 4]}>
                <Inline justifyContent="spaceBetween" alignY="center">
                  <Text variant="h2">Auglýsingar tengdar umsókninni</Text>
                  <LinkV2 href={PageRoutes.APPLICATIONS}>
                    <Button preTextIcon="arrowBack" variant="text" size="small">
                      Tilbaka í umsóknir
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
                  {applicationType !== ApplicationTypeEnum.COMMON && (
                    <GridColumn span={['12/12', '3/12']}>
                      <Inline align="right">
                        <AddAdvertsToApplicationMenu />
                      </Inline>
                    </GridColumn>
                  )}
                </GridRow>
                <GridRow>
                  <GridColumn span="12/12">
                    <Button
                      icon={showAsCards ? 'menu' : 'copy'}
                      iconType="outline"
                      variant="utility"
                      onClick={() => setShowAsCards((prev) => !prev)}
                    >
                      {showAsCards ? 'Sýna sem töflu' : 'Sýna sem spjöld'}
                    </Button>
                  </GridColumn>
                </GridRow>
              </Stack>
              {showAsCards ? (
                <AdvertList adverts={adverts} />
              ) : (
                <AdvertTable adverts={adverts} />
              )}
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
