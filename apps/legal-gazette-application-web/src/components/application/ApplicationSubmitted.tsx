'use client'

import { useParams } from 'next/navigation'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { AdvertDto, ApplicationTypeEnum } from '../../gen/fetch'
import { PageRoutes } from '../../lib/constants'
import { AddAdvertsToApplicationMenu } from '../adverts/AddAdvertsToApplicationMenu'
import { AdvertList } from '../adverts/AdvertList'
import { AdvertTable } from '../adverts/AdvertTable'

type Props = {
  title: string
  subtitle: string
  applicationType: ApplicationTypeEnum
  adverts?: AdvertDto[]
}

export const ApplicationSubmitted = ({
  adverts,
  applicationType,
  title,
  subtitle,
}: Props) => {
  const { id: applicationId } = useParams()
  const [showAsCards, setShowAsCards] = useState(false)

  const pageTitle =
    applicationType == ApplicationTypeEnum.COMMON
      ? 'Birtingar tengdar auglýsingu'
      : applicationType == ApplicationTypeEnum.RECALLBANKRUPTCY
        ? 'Auglýsingar tengdar þrotabúi'
        : 'Auglýsingar tengdar dánarbúi'
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Box background="white" borderRadius="large" padding={[4, 5, 6]}>
            <Stack space={[4]}>
              <Stack space={[2, 3, 4]}>
                <Inline justifyContent="spaceBetween" alignY="top">
                  <Text variant="h3">{title + ' - ' + subtitle}</Text>
                  <LinkV2 href={PageRoutes.FRONTPAGE}>
                    <Button preTextIcon="arrowBack" variant="text" size="small">
                      Til baka á forsíðu
                    </Button>
                  </LinkV2>
                </Inline>
                <GridRow>
                  <GridColumn span={['12/12', '9/12']}>
                    <Text>{pageTitle}</Text>
                  </GridColumn>
                  {applicationType !== ApplicationTypeEnum.COMMON && (
                    <GridColumn span={['12/12', '3/12']}>
                      <Inline align="right">
                        <AddAdvertsToApplicationMenu
                          applicationId={applicationId as string}
                        />
                      </Inline>
                    </GridColumn>
                  )}
                </GridRow>
                {applicationType !== ApplicationTypeEnum.COMMON && (
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
                )}
              </Stack>
              {adverts ? (
                showAsCards ? (
                  <AdvertList adverts={adverts} />
                ) : (
                  <AdvertTable
                    applicationId={applicationId as string}
                    adverts={adverts}
                  />
                )
              ) : (
                <Text>Engar auglýsingar fundust</Text>
              )}
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
