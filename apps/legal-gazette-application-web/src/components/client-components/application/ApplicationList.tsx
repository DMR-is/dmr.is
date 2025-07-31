'use client'

import useSWR from 'swr'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
  Text,
} from '@island.is/island-ui/core'

import { ApplicationDto } from '../../../gen/fetch'
import { getMyApplications } from '../../../lib/fetchers'
import { ApplicationCard } from './ApplicationCard'

type Props = {
  applications: ApplicationDto[]
}

export const ApplicationList = ({ applications }: Props) => {
  const { data } = useSWR('getMyApplications', getMyApplications, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: true,
    fallbackData: { applications: applications },
  })

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '10/12']} offset={['0', '1/12']}>
          <Stack space={[2, 3, 4]}>
            <Text variant="h2">Mínar umsóknir</Text>
            {data.applications.map((application, i) => (
              <ApplicationCard application={application} key={i} />
            ))}
          </Stack>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
