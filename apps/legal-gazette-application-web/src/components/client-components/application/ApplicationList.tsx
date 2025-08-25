'use client'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { ApplicationDto } from '../../../gen/fetch'
import { ApplicationCard } from './ApplicationCard'

type Props = {
  applications: ApplicationDto[]
}

export const ApplicationList = ({ applications }: Props) => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Stack space={[2, 3, 4]}>
            <Text variant="h2">Mínar umsóknir</Text>
            {applications.map((application, i) => (
              <ApplicationCard application={application} key={i} />
            ))}
            {applications.length === 0 && (
              <Text>Þú hefur ekki skráð neinar umsóknir ennþá.</Text>
            )}
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
