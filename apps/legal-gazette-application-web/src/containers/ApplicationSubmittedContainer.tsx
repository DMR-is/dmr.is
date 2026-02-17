'use client'

import { useSuspenseQuery } from '@dmr.is/trpc/client/trpc'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { ApplicationSubmittedHeader } from '../components/application/application-submitted/Header'
import { ApplicationAdverts } from '../components/application-adverts/ApplicationAdverts'
import { ApplicationTypeEnum } from '../gen/fetch'
import { useTRPC } from '../lib/trpc/client/trpc'

type Props = {
  applicationId: string
}

const mapApplicationDescription = (type: ApplicationTypeEnum) => {
  switch (type) {
    case ApplicationTypeEnum.COMMON:
      return 'Birtingar tengdar auglýsingu'
    case ApplicationTypeEnum.RECALLBANKRUPTCY:
      return 'Auglýsingar tengdar þrotabúi'
    case ApplicationTypeEnum.RECALLDECEASED:
      return 'Auglýsingar tengdar dánarbúi'
    default:
      return 'Birtingar tengdar auglýsingu'
  }
}

export const ApplicationSubmittedContainer = ({ applicationId }: Props) => {
  const trpc = useTRPC()
  const { data: application } = useSuspenseQuery(
    trpc.getApplicationById.queryOptions({ id: applicationId }),
  )

  const description = mapApplicationDescription(application.type)

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Box background="white" borderRadius="large" padding={[4, 5, 6]}>
            <Stack space={[2, 3, 4]}>
              <ApplicationSubmittedHeader
                applicationId={applicationId}
                title={application.title}
                subtitle={application.subtitle}
                description={description}
                showAddAdvertsButton={
                  application.type !== ApplicationTypeEnum.COMMON
                }
              />
              <ApplicationAdverts
                showToggle={application.type !== ApplicationTypeEnum.COMMON}
                applicationId={applicationId}
                adverts={application.adverts}
              />
            </Stack>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
